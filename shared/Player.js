// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    HashList = require('./lib/HashList').HashList,
    IdPool = require('./lib/IdPool').IdPool,
    Component = require('./Component').Component;

"use strict";


// Shared Player Logic --------------------------------------------------------
var Player = Class(function(parent, isRemote) {

    Component(this, 'Player', parent);

    // Unique ID of the player
    this.id = Player.IdPool.get();

    // Whether the player is remote or not
    this._isRemote = isRemote;

    // Ping of the remote associated with this player
    this._ping = 0;

    // Entities owned by the player
    this.entities = new HashList();

}, Component, {

    // Statics ----------------------------------------------------------------
    $IdPool: new IdPool(),


    // Methods ----------------------------------------------------------------
    init: function(data) {
        this.log('Init Player', this, data);
    },

    update: function(type, time, u) {

    },

    message: function(type, data) {
        this.log('Message', type, data);
    },

    destroy: function() {

        this.entities.clear();
        this.log('Destroy Player', this);

        Player.IdPool.release(this.id);
        this.id = null;

    },


    // Getters / Setters ------------------------------------------------------
    isRemote: function() {
        return this._isRemote;
    },

    isLocal: function() {
        return !this._isRemote;
    },

    getPing: function() {
        return this._ping;
    },

    setPing: function(ping) {
        this._ping = ping;
    },


    // Entities ---------------------------------------------------------------
    addEntity: function(entity) {
        return this.entities.add(entity);
    },

    getEntities: function() {
        return this.entities;
    },

    removeEntity: function(entity) {
        return this.entities.remove(entity);
    },


    // Network ----------------------------------------------------------------
    send: function(type, msg) {
        this.parent.send(type, msg);
    },

    setState: function(state) {
        this.id = state[0];
    },

    updateState: function() {
        this.parent.updatePlayerState(this);
    },

    getState: function(type) {
        return [this.id];
    },


    // Helpers ----------------------------------------------------------------
    toString: function() {
        var remote = this.isRemote() ? '(Remote)' : '(Local)';
        return '[Player #' + this.id + ' ' + remote + ']';
    }

});


// Exports --------------------------------------------------------------------
exports.Player = Player;

