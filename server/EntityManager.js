// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    BaseEntityManager = require('../shared/EntityManager').EntityManager,
    Network = require('./Network').Network;


// Server Side Entity State Manager -------------------------------------------
var EntityManager = Class(function(parent) {
    BaseEntityManager(this, parent);

}, BaseEntityManager, {

    addEntity: function(entity) {

        if (this.entities.add(entity)) {
            entity.parent = this;
            this.messages.push([Network.Entity.Add, entity.getState(true, true)]);
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

            this.messages.push([Network.Entity.Remove, entity.id]);
            this.log('Entity removed', entity);
            entity.destroy();
            return entity;

        }

    },

    send: function() {

        this.entities.each(function(entity) {
            entity.bufferState();
            this.messages.push([Network.Entity.Update, entity.getState(true)]);

        }, this);

        for(var i = 0, l = this.messages.length; i < l; i++) {
            this.parent.send.apply(this.parent, this.messages[i]);
        }

        this.messages.length = 0;

    }

});


// Exports --------------------------------------------------------------------
exports.EntityManager = EntityManager;

