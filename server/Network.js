// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    HashList = require('../shared/lib/HashList').HashList,
    BaseNetwork = require('../shared/Network').Network,

    // External
    lithium = require('lithium'),
    BISON = require('bisonjs');


// Server Side Network Abstraction --------------------------------------------
var Network = Class(function(parent) {

    BaseNetwork(this, parent);

    // Remote List
    this.remotes = null;

}, BaseNetwork, {

    // Methods ----------------------------------------------------------------
    init: function(port, host) {

        BaseNetwork.init(this, port, host);

        this.remotes = new HashList();
        this.socket = new lithium.Server(
            this.connection.bind(this),
            BISON.encode,
            BISON.decode
        );

        this.socket.listen(port, host);

    },

    message: function(remote, type, data) {

        if (type === Network.Client.Login) {
            this.addPlayer(remote, data);

        } else {
            if (!this.parent.message(remote, type, data)) {
                remote.player.message(type, data);
            }
        }

    },

    destroy: function() {
        BaseNetwork.destroy(this);
        this.remotes.clear();
    },


    // Getters / Setters ------------------------------------------------------
    getStats: function() {

        var stats = {
            bytesSend: 0,
            bytesReceived: 0
        };

        this.remotes.each(function(remote) {
            stats.bytesSend += remote.bytesSend;
            stats.bytesReceived += remote.bytesReceived;
            remote.bytesSend = 0;
            remote.bytesReceived = 0;

        }, this);

        return stats;

    },


    // Players ----------------------------------------------------------------
    addPlayer: function(remote, data) {

        var player = this.parent.addPlayer(data, true);
        if (player) {

            // Send player to remotes
            this.remotes.each(function(other) {
                other.send([Network.Player.Join.Remote, player.getState(true)]);
            });

            // Send player to itself
            player.send(Network.Player.Join.Local, player.getState(true));

            remote.player = player;
            this.remotes.add(remote);
        }

    },

    removePlayer: function(remote) {

        if (remote.player) {
            this.parent.removePlayer(remote.player);
            this.socket.send([Network.Player.Leave, remote.player.getState()]);
            remote.player = null;
        }

    },


    // Network Events ---------------------------------------------------------
    connection: function(remote) {
        remote.accept();
        BaseNetwork.connection(this, remote);
    },

    close: function(remote, closedByRemote) {

        if (this.remotes.remove(remote)) {

            this.removePlayer(remote);
            this.parent.close(remote, !closedByRemote);

            if (closedByRemote) {
                this.log('Disconnected', remote.toString());

            } else {
                this.log('Kicked', remote.toString());
            }

        }

    }

});


// Exports --------------------------------------------------------------------
exports.Network = Network;

