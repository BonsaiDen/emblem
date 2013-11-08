// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    Emblem = require('../shared/Emblem').Emblem,
    Loop = require('../shared/Loop').Loop,

    // Client
    Network = require('./Network').Network,
    EntityManager = require('./EntityManager').EntityManager;

"use strict";


// Top Level Client Logic -----------------------------------------------------
var Client = Class(function(gameClass) {
    Emblem(this, gameClass);

    // Classes
    this.networkClass = Network;
    this.entityManagerClass = EntityManager;

    // Time offset correction
    this._connectTime = 0;

}, Emblem, {

    // Methods ----------------------------------------------------------------
    connect: function(port, host) {
        this._connectTime = Date.now();
        this.init(port, host, null);
    },

    start: function(state, serverOffset) {

        // Correct server loop offset by half of connect roundtrip
        serverOffset += Math.floor((Date.now() - this._connectTime) / 2);

        this.game.setState(state);
        this.game.init();

        this.loop = new Loop(
            this,
            this.game.getFps(),
            this.update.bind(this),
            this.render.bind(this),
            this
        );

        this.loop.start(serverOffset);

    },

    render: function(time, u) {
        this.entityManager.render(time, u);
        this.game.render(time, u);
    },

    disconnect: function() {
        this.destroy();
    },


    // Getters / Setters ------------------------------------------------------
    isServer: function() {
        return false;
    },

    isClient: function() {
        return true;
    },


    // Network ----------------------------------------------------------------
    message: function(remote, type, data) {

        // Entities
        if (type === Network.Entity.Add) {
            var added = this.entityManager.addEntity(data);
            added && this.game.addEntity(added);
            return true;

        } else if (type === Network.Entity.Owner) {
            this.entityManager.setEntityOwner(data);
            return true;

        } else if (type === Network.Entity.Update) {
            this.entityManager.updateEntity(data);
            return true;

        } else if (type === Network.Entity.Remove) {
            var removed = this.entityManager.removeEntity(data);
            removed && this.game.removeEntity(removed);
            return true;

        // Other
        } else {
            return this.game.message(remote, type, data);
        }

    },

    close: function(remote, closedByServer) {
        Emblem.close(this, remote, closedByServer);
        this.disconnect();
    },


    // Players ----------------------------------------------------------------
    updatePlayerState: function(player, state) {
        player.setState(state);
    }

});


// Exports --------------------------------------------------------------------
exports.Client = Client;

