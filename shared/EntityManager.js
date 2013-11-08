// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    HashList = require('./lib/HashList').HashList,
    Component = require('./Component').Component,
    Network = require('./Network').Network;

"use strict";


// Entity State Manager -------------------------------------------------------
var EntityManager = Class(function(parent) {

    Component(this, 'EntityManager', parent);

    // List of existing entities
    this.entities = new HashList();

    // Message Buffer with Updates TODO also use in game?
    this.messages = [];

    // TODO entity visibility player whitelist

}, Component, {

    init: function(remote) {
        this.entities.each(function(entity) {
            remote.send([
                Network.Entity.Add,
                entity.getState(true, Network.State.Add)
            ]);
        });
    },

    update: function(type, time, u) {

        this.entities.each(function(entity) {
            entity.update(type, time, u);

        }, this);

    },

    render: function(time, u) {
        this.entities.each(function(entity) {
            entity.render(time, u);
        });
    },

    destroy: function() {

        this.entities.each(function(entity) {
            this.removeEntity(entity);

        }, this);

        this.entities.destroy();
        this.messages.length = 0;

    },


    // Getters / Setters ------------------------------------------------------
    isServer: function() {
        return this.parent.isServer();
    },

    getGame: function() {
        return this.parent.getGame();
    },

    getEntities: function() {
        return this.entities;
    },

    getOwnerById: function(id) {
        return this.parent.getPlayerById(id) || null;
    }

});


// Exports --------------------------------------------------------------------
exports.EntityManager = EntityManager;

