// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    HashList = require('./lib/HashList').HashList,
    Component = require('./Component').Component,
    Entity = require('./Entity').Entity;


// Shared Game Logic ----------------------------------------------------------
var Game = Class(function(parent) {

    Component(this, 'Game', parent);

    // List of Players
    this.players = null;

}, Component, {

    // Statics ----------------------------------------------------------------
    $PlayerClass: null,
    $registerPlayerClass: function(clas) {
        Game.PlayerClass = clas;
    },

    $EntityTypeClasses: {},
    $registerEntityClass: function(clas) {
        Game.EntityTypeClasses[clas.Type] = clas;
    },


    // Methods ----------------------------------------------------------------
    init: function() {
        this.players = new HashList();
    },

    update: function(time, u) {
        this.players.each(function(player) {
            player.update(time, u);
        });
    },

    destroy: function() {
        this.config = null;
        this.players.clear();
    },


    // Getters / Setters ------------------------------------------------------
    // TODO Ugly remove
    getFps: function() {
        return this.config.fps;
    },

    // TODO Ugly remove
    getConfig: function() {
        return this.config;
    },

    isServer: function() {
        return this.parent.isServer();
    },

    isClient: function() {
        return this.parent.isClient();
    },


    // Players ----------------------------------------------------------------
    getPlayers: function() {
        return this.players;
    },

    getPlayerById: function(id) {
        return this.players.get(id);
    },

    getPlayerClass: function() {
        return Game.PlayerClass;
    },

    getEntityClassFromType: function(type) {
        return Game.EntityTypeClasses[type] || null;
    },

    addPlayer: function(data, isRemote) {

        var playerClass = this.getPlayerClass(),
            player = new playerClass(this, isRemote);

        if (this.isClient()) {
            player.setState(data);
            player.init(null);

        } else {
            player.init(data);
        }

        return this.players.add(player);

    },

    removePlayer: function(id) {
        var player = this.players.remove(id);
        if (player) {
            player.destroy();
        }
        return player;
    },


    // Entities ---------------------------------------------------------------
    addEntity: function(entity) {
        this.parent.addEntity(entity);
    },

    removeEntity: function(entity) {
        this.parent.removeEntity(entity);
    },

    getEntities: function() {
        return this.parent.getEntities();
    },


    // Network ----------------------------------------------------------------
    connection: function(remote) {
        this.log('Connected', remote.toString());
    },

    message: function(remote, type, data) {
        this.log('Message', type, data);
    },

    close: function(remote, closedByServer) {

        if (closedByServer) {
            this.log('Kicked', remote.toString());

        } else {
            this.log('Disconnected', remote.toString());
        }

    },

    send: function(type, msg) {
        this.parent.send(type, msg);
    },

    setState: function(state) {
        this.config = state[0];
    },

    getState: function() {
        return [this.config];
    }

});


// Entity Types ---------------------------------------------------------------
Game.registerEntityClass(Entity);


// Exports --------------------------------------------------------------------
exports.Game = Game;

