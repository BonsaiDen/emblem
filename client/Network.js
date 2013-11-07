// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    BaseNetwork = require('../shared/Network').Network,
    Loop = require('../shared/Loop').Loop,

    // External
    lithium = require('lithium/client/lithium').lithium,
    BISON = require('bisonjs');

"use strict";


// Client Side Network Abstraction --------------------------------------------
var Network = Class(function(parent) {

    BaseNetwork(this, parent);

    this._stats = {

        server: {
            send: 0,
            received: 0
        },

        client: {
            send: 0,
            received: 0
        }

    };

}, BaseNetwork, {

    // Methods ----------------------------------------------------------------
    init: function(port, host) {

        BaseNetwork.init(this, port, host);

        this.socket = new lithium.Client(
            this.connection.bind(this),
            BISON.encode,
            BISON.decode
        );

        // Connect and send initial ping
        this.socket.connect(port, host);
        this.socket.send([
            Network.Client.Ping, Date.now() % Network.Ping.Range,
            0
        ]);

    },

    update: function(type, time, u) {

        if (type === Loop.Update.Tick) {
            this._stats.client.send = this.socket.bytesSend;
            this._stats.client.received = this.socket.bytesReceived;
            this.socket.bytesSend = 0;
            this.socket.bytesReceived = 0;
        }

        BaseNetwork.update(this, type, u);

    },

    bufferedMessage: function(client, type, data) {

        // Player
        var player;
        if (type === Network.Player.Join.Local) {
            this.parent.addPlayer(data, false);

        } else if (type === Network.Player.Join.Remote) {
            this.parent.addPlayer(data, true);

        } else if (type === Network.Player.Ping) {
            player = this.parent.getPlayerById(data[0]);
            if (player) {
                player.setPing(data[1]);
            }

        } else if (type === Network.Player.Update) {
            player = this.parent.getPlayerById(data[0]);
            if (player) {
                this.parent.updatePlayerState(player, data);
            }

        } else if (type === Network.Player.Leave) {
            this.parent.removePlayer(data[0]);

        } else if (type === Network.Server.Stats) {
            this._stats.server.send = data[0];
            this._stats.server.received = data[1];

        // Other
        } else {

            if (!this.parent.message(client, type, data)) {

                // Forward to local players if left unhandled
                this.parent.getPlayers().each(function(player) {
                    if (player.isLocal()) {
                        player.message(type, data);
                    }
                });

            }

        }

    },


    // Network Events ---------------------------------------------------------
    message: function(remote, type, data) {

        if (type === Network.Server.Init) {
            this.parent.start(data);

        // Ping
        } else if (type === Network.Server.Ping) {
            this.socket.send([
                Network.Client.Ping, [
                    Date.now() % Network.Ping.Range,
                    Math.round((Date.now() - data) % Network.Ping.Range)
                ]
            ]);

        } else {
            BaseNetwork.message(this, remote, type, data);
        }

    },

    close: function(client, closedByServer) {

        if (closedByServer) {
            this.log('Kicked', client.toString());
            this.parent.close(client, closedByServer);
            this.destroy();

        } else {
            this.log('Connected', client.toString());
        }

    }

});


// Exports --------------------------------------------------------------------
exports.Network = Network;

