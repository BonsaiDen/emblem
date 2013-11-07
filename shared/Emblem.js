// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    Component = require('./Component').Component,
    Loop = require('./Loop').Loop;

"use strict";


// Shared Client / Server Logic -----------------------------------------------
var Emblem = Class(function(gameClass) {

    Component(this, 'Emblem', null);

    // Main Loop
    this.loop = null;

    // Network Handler
    this.network = null;

    // Entity Manager
    this.entityManager = null;

    // Game Instance
    this.game = null;

    // Classes
    this.gameClass = gameClass;
    this.networkClass = null;
    this.entityManagerClass = null;

}, Component, {

    // Methods ----------------------------------------------------------------
    init: function(port, host) {

        this.entityManager = new this.entityManagerClass(this);

        this.network = new this.networkClass(this);
        this.network.init(port, host);

        this.game = new this.gameClass(this);

    },

    update: function(type, time, u) {

        this.network.update(type, time, u);
        this.entityManager.update(type, time, u);
        this.game.update(type, time, u);

        if (type === Loop.Update.Normal) {
            this.entityManager.send();
        }

    },

    destroy: function() {
        this.loop && this.loop.stop();
        this.network && this.network.destroy();
        this.entityManager && this.entityManager.destroy();
        this.game && this.game.destroy();
        this.log('Stopped');
    },


    // Network ----------------------------------------------------------------
    connection: function(client) {
        this.game.connection(client);
    },

    send: function(type, msg) {
        this.network.send(type, msg);
    },

    getState: function() {
        return this.game.getState();
    },

    close: function(remote, closedByRemote) {
        this.game.close(remote, closedByRemote);
    },


    // Getters / Setters ------------------------------------------------------
    isServer: function() {
        throw new TypeError('Emblem.isServer() is abstract for ' + this);
    },

    isClient: function() {
        throw new TypeError('Emblem.isClient() is abstract for ' + this);
    },

    getGame: function() {
        return this.game;
    },


    // Players ----------------------------------------------------------------
    getPlayers: function() {
        return this.game.getPlayers();
    },

    getPlayerById: function(id) {
        return this.game.getPlayerById(id);
    },

    addPlayer: function(data, isRemote) {
        var player = this.game.addPlayer(data, isRemote);
        this.log('Player joined', player.toString());
        return player;
    },

    removePlayer: function(id) {
        var player = this.game.removePlayer(id);
        this.log('Player left', player.toString());
        return player;
    },


    // Entities ---------------------------------------------------------------
    getEntityClassFromType: function(type) {
        return this.game.getEntityClassFromType(type);
    },

    addEntity: function() {
        // Stub
    },

    getEntities: function() {
        return this.entityManager.getEntities();
    },

    removeEntity: function() {
        // Stub
    }

});


// Exports --------------------------------------------------------------------
exports.Emblem = Emblem;

