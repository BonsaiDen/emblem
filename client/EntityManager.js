// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    BaseEntityManager = require('../shared/EntityManager').EntityManager,
    Network = require('./Network').Network;

"use strict";


// Client Side Entity State Manager -------------------------------------------
var EntityManager = Class(function(parent) {
    BaseEntityManager(this, parent);

}, BaseEntityManager, {

    addEntity: function(state) {

        var entityClass = this.parent.getEntityClassFromType(state[9]),
            entity = new entityClass();

        entity.parent = this;
        entity.setState(state);

        this.entities.add(entity);
        this.log('Add Entity', entity);

        return entity;

    },

    setEntityOwner: function(state) {

        var entity = this.entities.get(state[0]),
            owner = this.parent.getPlayerById(state[1]);

        if (entity) {
            entity.setOwner(owner);
            this.log('Set Entity Owner', entity, entity.getOwner());
        }

    },

    updateEntity: function(state) {

        var entity = this.entities.get(state[0]);
        if (entity) {
            entity.updateState(state);
        }

    },

    removeEntity: function(state) {

        var entity = this.entities.get(state);
        if (this.entities.remove(entity)) {
            this.log('Remove Entity', entity);
            entity.destroy();
            return entity;
        }

    },

    send: function() {
        this.entities.each(function(entity) {
            if (!entity.isRemote()) {
                this.parent.send(Network.Entity.ClientUpdate, entity.getState());
            }

        }, this);
    }

});


// Exports --------------------------------------------------------------------
exports.EntityManager = EntityManager;

