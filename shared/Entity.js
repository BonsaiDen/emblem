// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    IdPool = require('./lib/IdPool').IdPool,
    EntityVector = require('./EntityVector').EntityVector,
    Network = require('./Network').Network;

"use strict";


// Networked Entity Logic -----------------------------------------------------
var Entity = Class(function(x, y, r, speed, angular, radius) {

    // EntityManager of this Entity
    this.parent = null;

    // Unique ID
    this.id = Entity.IdPool.get();

    // Position / Angle
    this.vector = new EntityVector(x, y, r);

    // Velocities / Target angle
    this.velocity = new EntityVector(0, 0, r);

    // Rendering Position / Angle
    this.renderVector = new EntityVector(x, y, r);

    // Speed limit (in units per second)
    this.speed = speed;

    // Rotation Limit (in degrees per second)
    this.angular = angular;

    // Collision Radius
    this.radius = radius;


    // Internals --------------------------------------------------------------


    // Custom Type Identifier of the entity
    this._type = Entity.Type;

    // Circular buffer of the last X states of the entity
    this._stateBuffer = new Array(Entity.StateBufferSize);
    this._stateBufferIndex = 0;
    this._stateBufferCache = 0;

    // Input State (e.g. pressed buttons / keys )
    this._inputState = 0;

    // Last remote EntityVector
    this._remoteVector = new EntityVector(x, y, r);

    // Rendering Interpolation
    this._lastRenderVector = new EntityVector(x, y, r);

    // Whether the entity is fully remote or locally controlled
    this._isRemote = true;

    // Owner of this entity
    this._owner = null;

    // State of the entity before it is projected, this is used to revert
    // to the current state after the projection
    this._projectedState = null;

}, {

    // Statics ----------------------------------------------------------------
    $IdPool: new IdPool(),

    // How many states to buffer the buffered state durration in milliseconds is
    // 1000 / FPS * StateBufferSize
    $StateBufferSize: 20,

    // How many frames the clients will be behind with their state of
    // remote entities
    $StateDelay: 2,

    // Error range in units per frame of difference between client and server
    // Total error range is ErrorRange * FrameDifference
    $ErrorRange: 5,

    // Unique Type ID identifying this entity
    $Type: 0,


    // API --------------------------------------------------------------------
    setOwner: function(owner) {

        if (this.parent.isServer()) {

            if (this._owner !== owner) {

                if (this._owner) {
                    this._owner.removeEntity(this);
                }

                this._owner = owner;
                this._owner.addEntity(this);
                this.parent.setEntityOwner(this, owner);

            }

        } else {

            if (this._owner) {
                this._owner.removeEntity(this);
            }

            this.velocity.r = this.vector.r;
            this._isRemote = owner.isRemote();

            this._owner = owner;
            this._owner.addEntity(this);

        }

    },

    setInputState: function(inputState) {
        this._inputState = inputState;
    },

    projectState: function(block, scope) {

        var entity = this,
            entities = this.parent.getEntities();

        // TODO if we can get a more up to date / accurate RT value this will
        // become more accurate
        var rtDelay = Math.floor(this.getOwner().getPing() * 2 / (1000 / this.getGame().getFps())),
            offset = (Entity.StateDelay + rtDelay);

        //console.log(rtDelay, Entity.StateDelay);

        // Set states of all other entities to the expected, matching client state
        entities.each(function(other) {

            if (other !== entity) {
                other._projectedState = other.getState(false, Network.State.Add);
                other.setState(other.getBufferedState(offset));
                //other.setState(other._stateBuffer[other._stateBuffer.length - offset]);
            }

        });

        // Call the passed function which should handle things like hit detection
        block.call(scope || null, entities);

        // Reset the states of the other entities to their previousState
        entities.each(function(other) {
            if (other !== entity) {
                other.setState(other._projectedState);
                other._projectedState = null;
            }
        });

    },

    remove: function() {
        if (this.parent.isServer()) {
            this.parent.removeEntity(this);
        }
    },


    // Getter -----------------------------------------------------------------
    getInputState: function() {
        return this._inputState;
    },

    getOwner: function() {
        return this._owner;
    },

    getGame: function() {
        return this.parent.getGame();
    },

    isRemote: function() {
        return this.parent.isServer() ? this._isRemote && this._owner
                                      : this._isRemote;
    },


    // Methods ----------------------------------------------------------------
    update: function(type, time, u) {

        this._lastRenderVector.setFromVector(this.vector);

        var vel;
        if (this.isRemote()) {

            // Calculate local velocity change
            vel = this.vector.subtract(this._remoteVector);

            // Limit Vectors
            vel.limit(this.speed * u, this.angular * u);

            // Set calculated velocties for visual updates
            this.velocity.x = vel.x;
            this.velocity.y = vel.y;
            this.velocity.r = vel.r;

            // Set the new local vector of the remote entity
            this.vector.add(vel);

            // Set the angle directly
            this.vector.r = this._remoteVector.r;

        } else {

            // Calculate local velocity change
            vel = new EntityVector(
                this.velocity.x,
                this.velocity.y,
                EntityVector.degreeDiff(this.vector.r, this.velocity.r)
            );

            // Limit Vectors
            vel.limit(this.speed * u, this.angular * u);

            // Update local vector and cached remote vector
            this.vector.add(vel);

        }

    },

    render: function(time, u) {
        this.renderVector.setFromVector(this._lastRenderVector);
        this.renderVector.add(this.vector.subtract(this._lastRenderVector).mul(-u));
        this.renderVector.round();
    },

    destroy: function() {

        Entity.IdPool.release(this.id);

        this.id = null;
        this.vector = null;
        this.renderVector = null;
        this.velocity = null;
        this.speed = null;
        this.angular = null;
        this.radius = null;

        this._stateBuffer = null;
        this._stateBufferIndex = null;
        this._remoteVector = null;
        this._lastRenderVector = null;
        this._inputState = null;
        this._type = null;
        this._owner = null;

    },


    // Network State Handling -------------------------------------------------
    updateState: function(state, correctPosition) {

        this._remoteVector.set(state[3], state[4], state[2]);

        // Set input state for remotes but don't overwrite local input state
        if (this.isRemote()) {
            this._inputState = state[1];
        }

        if (correctPosition) {

            // Get correct from ping
            var ping = this.getOwner().getPing(),
                td = Math.max(Math.round(ping / (1000 / this.getGame().getFps())), 1);

            // Until we have a ping we cannot correct he position and the client
            // has to trust himself
            if (ping === 0) {
                return;
            }

            // See how much the local states diverge from the remote position
            var minDistance = 1000000,
                index = -1;

            // The more of the buffer we iterate, the higher the time needed
            // until a correction happens
            var l = Math.min(Math.max(td * 3, 8), this._stateBufferCache);
            for(var i = 1; i < l; i++) {

                var local = this.getBufferedState(i),
                    dx = (local[3] - state[3]),
                    dy = (local[4] - state[4]),
                    dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance){
                    minDistance = dist;
                    index = i;
                }

            }

            if (minDistance > 0) {

                td = Math.max(td, 1);

                // If the distance it outside the error range
                // we ran into lag or local cheating
                // in either case, reset the position to the last known
                // server state
                if (minDistance > Entity.ErrorRange * td) {
                    console.log('====================== CORRECT POSITION ===========================');
                    console.log(minDistance, Entity.ErrorRange * td, td);
                    this.vector.x = state[3];
                    this.vector.y = state[4];
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }

            }

        }

    },

    bufferState: function() {
        this._stateBuffer[this._stateBufferIndex] = this.getState(false, Network.State.Update);
        this._stateBufferIndex = (this._stateBufferIndex + 1) % Entity.StateBufferSize;
        this._stateBufferCache = Math.min(this._stateBufferCache + 1, Entity.StateBufferSize);
    },

    getBufferedState: function(offset) {

        offset = Math.min(offset, this._stateBufferCache);

        var index = (this._stateBufferIndex - offset) % Entity.StateBufferSize;
        if (index < 0) {
            index += Entity.StateBufferSize;
        }

        return this._stateBuffer[index];

    },

    getState: function(toRemote, type) {

        // Full state
        if (type === Network.State.Add) {
            return [
                this.id,
                this._inputState,
                Math.round(this.vector.r),
                Math.round(this.vector.x),
                Math.round(this.vector.y),
                this.speed,
                this.angular,
                this.radius,
                this._type,
                this._owner ? this._owner.id : null
            ];

        } else if (type === Network.State.Remove) {
            return [this.id];

        // Delayed state when sending to a remote
        } else if (toRemote) {

            var state = this.getBufferedState(Entity.StateDelay);
            if (state) {
                return state;

            } else {
                return this.getState(false, Network.State.Update);
            }

        // Update state
        } else if (type === Network.State.Update) {
            return [
                this.id,
                this._inputState,
                Math.round(this.vector.r),
                Math.round(this.vector.x),
                Math.round(this.vector.y)
            ];
        }

    },

    setState: function(state) {

        this.id = state[0];
        this._inputState = state[1];
        this.vector.set(state[3], state[4], state[2]);
        this._remoteVector.set(state[3], state[4], state[2]);

        // Full state
        if (state.length > 5) {
            this.speed = state[5];
            this.angular = state[6];
            this.radius = state[7];
            this._type = state[8];
            this._owner = state[9] !== null ? this.parent.getOwnerById(state[9]) : null;
        }

    },

    toString: function() {
        var remote = this.isRemote() ? '(Remote)' : '(Local)';
        return '[Entity #' + this.id + ' ' + remote + ']';
    }

});


// Exports --------------------------------------------------------------------
exports.Entity = Entity;

