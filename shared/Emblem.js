// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    Component = require('./Component').Component,
    Loop = require('./Loop').Loop;


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

        if (type === Loop.Update.Normal) {
            this.network.update(time, u);
            this.entityManager.update(time, u);
            this.game.update(time, u);
            this.entityManager.send();
        }

    },

    destroy: function() {
        this.game && this.game.destroy();
        this.entityManager && this.entityManager.destroy();
        this.network && this.network.destroy();
        this.loop && this.loop.stop();
        this.log('Stopped');
    },


    // Network ----------------------------------------------------------------
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

