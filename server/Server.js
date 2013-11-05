// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    Emblem = require('../shared/Emblem').Emblem,
    Loop = require('../shared/Loop').Loop,

    // Server
    Network = require('./Network').Network,
    EntityManager = require('./EntityManager').EntityManager;


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

        this.log('Started');

    },

    update: function(type, time, u) {

        Emblem.update(this, type, time, u);

        if (type === Loop.Update.Tick) {
            this.send(Network.Server.Stats, this.network.getStats());
        }

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

        this.game.connection(remote);
        this.entityManager.init(remote);

    },

    message: function(remote, type, data) {

        if (type === Network.Entity.ClientUpdate) {
            this.entityManager.updateEntity(remote.player, data);
            return true;

        } else {
            this.game.message(remote, type, data);
        }

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

