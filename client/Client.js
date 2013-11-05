// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    Emblem = require('../shared/Emblem').Emblem,
    Loop = require('../shared/Loop').Loop,

    // Client
    Network = require('./Network').Network,
    EntityManager = require('./EntityManager').EntityManager;


// Top Level Client Logic -----------------------------------------------------
var Client = Class(function(gameClass) {
    Emblem(this, gameClass);

    // Classes
    this.networkClass = Network;
    this.entityManagerClass = EntityManager;

}, Emblem, {

    // Methods ----------------------------------------------------------------
    connect: function(port, host) {
        this.init(port, host, null);
    },

    start: function(state) {

        this.game.setState(state);
        this.game.init();

        this.loop = new Loop(
            this,
            this.game.getFps(),
            this.update.bind(this),
            this.render.bind(this),
            this
        );
        this.loop.start();

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
    connection: function(client) {
        this.game.connection(client);
    },

    message: function(remote, type, data) {

        // Entities
        if (type === Network.Entity.Add) {
            var added = this.entityManager.addEntity(data);
            added && this.game.addEntity(added);

        } else if (type === Network.Entity.Owner) {
            this.entityManager.setEntityOwner(data);

        } else if (type === Network.Entity.Update) {
            this.entityManager.updateEntity(data);

        } else if (type === Network.Entity.Remove) {
            var removed = this.entityManager.removeEntity(data);
            removed && this.game.removeEntity(removed);

        // Other
        } else {
            this.game.message(remote, type, data);
        }

    },

    close: function(remote, closedByServer) {
        Emblem.close(this, remote, closedByServer);
        this.disconnect();
    }

});


// Exports --------------------------------------------------------------------
exports.Client = Client;

