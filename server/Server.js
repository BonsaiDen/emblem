// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    Emblem = require('../shared/Emblem').Emblem,
    Loop = require('../shared/Loop').Loop,

    // Server
    Network = require('./Network').Network,
    EntityManager = require('./EntityManager').EntityManager;

"use strict";


// Top Level Server Logic -----------------------------------------------------
var Server = Class(function(gameClass) {

    Emblem(this, gameClass);

    // Classes
    this.networkClass = Network;
    this.entityManagerClass = EntityManager;

}, Emblem, {

    // Methods ----------------------------------------------------------------
    start: function(config, port, host) {

        this.init(port, host, config);
        this.game.setState([config]);
        this.game.init();

        this.loop = new Loop(
            this,
            this.game.getFps(),
            this.update.bind(this),
            null,
            this
        );
        this.loop.start();

        this.log('Started', process.pid);

    },

    stop: function() {
        this.destroy();
    },


    // Getters / Setters ------------------------------------------------------
    isServer: function() {
        return true;
    },

    isClient: function() {
        return false;
    },


    // Network ----------------------------------------------------------------
    connection: function(remote) {

        remote.send([Network.Server.Init, this.getState()]);

        this.getPlayers().each(function(player) {
            remote.send([Network.Player.Join.Remote, player.getState(true)]);
        });

        Emblem.connection(this, remote);
        this.entityManager.init(remote);

    },

    message: function(remote, type, data) {

        if (type === Network.Entity.ClientUpdate) {
            this.entityManager.updateEntity(remote.player, data);
            return true;

        } else {
            return this.game.message(remote, type, data);
        }

    },


    // Players ----------------------------------------------------------------
    updatePlayerState: function(player) {
        this.network.updatePlayer(player);
    },


    // Entities ---------------------------------------------------------------
    addEntity: function(entity) {
        this.entityManager.addEntity(entity);
    },

    removeEntity: function(entity) {
        this.entityManager.removeEntity(entity);
    }

});


// Exports --------------------------------------------------------------------
exports.Server = Server;

