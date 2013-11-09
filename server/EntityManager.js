// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    BaseEntityManager = require('../shared/EntityManager').EntityManager,
    Network = require('./Network').Network;

"use strict";


// Server Side Entity State Manager -------------------------------------------
var EntityManager = Class(function(parent) {
    BaseEntityManager(this, parent);

}, BaseEntityManager, {

    addEntity: function(entity) {

        if (this.entities.add(entity)) {

            entity.parent = this;

            this.messages.push([
                Network.Entity.Add,
                entity.getState(true, Network.State.Add)
            ]);

            this.log('Entity added', entity);
            return entity;

        }

    },

    setEntityOwner: function(entity, owner) {

        if (owner) {
            this.messages.push([Network.Entity.Owner, [entity.id, owner.id]]);
        }

        this.log('Set entity Owner', entity, owner);

    },

    updateEntity: function(owner, state) {

        var entity = this.entities.get(state[0]);
        if (entity && entity.getOwner() === owner) {
            entity.updateState(state);
        }

    },

    removeEntity: function(entity) {

        if (this.entities.remove(entity)) {

            this.messages.push([
                Network.Entity.Remove,
                entity.getState(true, Network.State.Remove)
            ]);

            console.log(this.messages);

            this.log('Entity removed', entity);
            entity.destroy();
            return entity;

        }

    },

    send: function() {

        this.entities.each(function(entity) {

            // Send the delayed state and buffer the current state
            this.messages.push([
                Network.Entity.Update,
                entity.getState(true, Network.State.Update)
            ]);

            // Note: It is important to do it this way around so that we actually
            // send the currentState - DelayCount BEFORE pushing a new value
            // to the buffer
            entity.bufferState();

        }, this);

        for(var i = 0, l = this.messages.length; i < l; i++) {
            this.parent.send.apply(this.parent, this.messages[i]);
        }

        this.messages.length = 0;

    }

});


// Exports --------------------------------------------------------------------
exports.EntityManager = EntityManager;

