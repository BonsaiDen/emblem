// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    HashList = require('./lib/HashList').HashList,
    IdPool = require('./lib/IdPool').IdPool,
    Component = require('./Component').Component;


// Shared Player Logic --------------------------------------------------------
var Player = Class(function(parent, isRemote) {

    Component(this, 'Player', parent);

    // Unique ID of the player
    this.id = Player.IdPool.get();

    // Whether the player is remote or not
    this._isRemote = isRemote;

    // Entities owned by the player
    this.entities = new HashList();

}, Component, {

    // Statics ----------------------------------------------------------------
    $IdPool: new IdPool(),


    // Methods ----------------------------------------------------------------
    init: function(data) {
        this.log('Init Player', this, data);
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


    // Entities ---------------------------------------------------------------
    addEntity: function(entity) {
        return this.entities.add(entity);
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

    getState: function() {
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

