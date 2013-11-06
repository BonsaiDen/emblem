// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    IdPool = require('./lib/IdPool').IdPool,
    EntityVector = require('./EntityVector').EntityVector;


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

    // Synchronization tick mapping to the state buffer index
    this._tick = 0;
    this._remoteTick = 0;

    // List of the last Entity.StateBufferSize serialized states
    this._stateBuffer = [];

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

}, {

    // Statics ----------------------------------------------------------------
    $IdPool: new IdPool(),

    // How many states to buffer the buffered state durration in milliseconds is
    // 1000 / FPS * StateBufferSize
    $StateBufferSize: 30,

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

    setInputeState: function(inputState) {
        this._inputState = inputState;
    },

    getOwner: function() {
        return this._owner;
    },

    getGame: function() {
        return this.parent.getGame();
    },

    isRemote: function() {
        return this._isRemote;
    },

    remove: function() {
        if (this.parent.isServer()) {
            this.parent.removeEntity(this);
        }
    },

    projectState: function(block, scope) {

        var frameDiff = this._tick - this._remoteTick;
        if (frameDiff < 0) {
            frameDiff += Entity.StateBufferSize;
        }

        // TODO get tick diff between local and remote
        // TODO Temporarily set all entities to the calculated remove state
        // run block and pass entities
        // TODO reset the entities (make sure they are still valid though!)
    },


    // Methods ----------------------------------------------------------------
    update: function(time, u) {

        this._lastRenderVector.setFromVector(this.vector);
        this._tick = (this._tick + 1) % Entity.StateBufferSize;

        var vel;
        if (this._isRemote) {

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
        this._remoteVector = null;
        this.renderVector = null;
        this._stateBuffer = null;
        this._lastRenderVector = null;
        this.velocity = null;
        this._inputState = null;
        this.speed = null;
        this.angular = null;
        this.radius = null;
        this._type = null;
        this._owner = null;

    },


    // Network ----------------------------------------------------------------
    updateState: function(state, correctPosition) {

        this._remoteTick = state[1];
        this._remoteVector.set(state[3], state[4], state[2]);

        if (correctPosition) {

            // See how much the local states diverge from the remote position
            var minDistance = 10000000,
                index = -1;

            for(var i = 0; i < this._stateBuffer.length; i++) {

                var local = this._stateBuffer[i],
                    dx = (local[3] - state[3]),
                    dy = (local[4] - state[4]),
                    dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < minDistance){
                    minDistance = dist;
                    index = i;
                }

            }

            if (minDistance > 0) {

                // Calculate the number of frames of difference between
                // client and server
                var frameDiff = this._tick - this._remoteTick;
                if (frameDiff < 0) {
                    frameDiff += Entity.StateBufferSize;
                }

                frameDiff = Math.max(frameDiff, 1);

                // If the distance it outside the error range
                // we ran into heavy lag or local cheating
                // in either case, reset the position to the server state
                if (minDistance > Entity.ErrorRange * frameDiff) {
                    this.vector.x = state[3];
                    this.vector.y = state[4];
                    this.velocity.x = 0;
                    this.velocity.y = 0;
                }

            }

        }

    },

    bufferState: function() {

        this._stateBuffer.push(this.getState(false));
        if (this._stateBuffer.length > Entity.StateBufferSize) {
            this._stateBuffer.shift();
        }

    },

    getState: function(remote, full) {

        // Full state
        if (full) {
            return [
                this.id,
                this._tick,
                Math.round(this.vector.r),
                Math.round(this.vector.x),
                Math.round(this.vector.y),
                this._inputState,
                this.speed,
                this.angular,
                this.radius,
                this._type,
                this._owner ? this._owner.id : null
            ];

        // Delayed state when sending from server to client
        } else if (remote) {

            var state = this._stateBuffer[this._stateBuffer.length - 1 - Entity.StateDelay];
            if (state) {
                return state;

            } else {
                return this.getState(false, false);
            }

        // Update state
        } else {
            return [
                this.id,
                this._tick,
                Math.round(this.vector.r),
                Math.round(this.vector.x),
                Math.round(this.vector.y),
                this._inputState
            ];
        }

    },

    setState: function(state) {

        this.id = state[0];
        this.vector.set(state[3], state[4], state[2]);
        this._remoteVector.set(state[3], state[4], state[2]);
        this._inputState = state[5];

        // Full state only
        if (state.length > 6) {
            this.speed = state[6];
            this.angular = state[7];
            this.radius = state[8];
            this._type = state[9];
            this._owner = state[10] !== null ? this.parent.getOwnerById(state[10]) : null;
        }

    },

    toString: function() {
        var remote = this._isRemote ? '(Remote)' : '(Local)';
        return '[Entity #' + this.id + ' ' + remote + ']';
    }

});


// Exports --------------------------------------------------------------------
exports.Entity = Entity;

