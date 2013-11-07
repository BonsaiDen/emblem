// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    HashList = require('../shared/lib/HashList').HashList,
    BaseNetwork = require('../shared/Network').Network,
    Loop = require('../shared/Loop').Loop,

    // External
    lithium = require('lithium'),
    BISON = require('bisonjs');

"use strict";


// Server Side Network Abstraction --------------------------------------------
var Network = Class(function(parent) {

    BaseNetwork(this, parent);

    // Remote List
    this._remotes = null;

}, BaseNetwork, {

    // Methods ----------------------------------------------------------------
    init: function(port, host) {

        BaseNetwork.init(this, port, host);

        this._remotes = new HashList();

        this.socket = new lithium.Server(
            this.connection.bind(this),
            BISON.encode,
            BISON.decode
        );

        this.socket.listen(port, host);

    },

    update: function(type, time, u) {

        if (type === Loop.Update.Tick) {

            var bytesSend = 0,
                bytesReceived = 0;

            this._remotes.each(function(remote) {
                bytesSend += remote.bytesSend;
                bytesReceived += remote.bytesReceived;
                remote.bytesSend = 0;
                remote.bytesReceived = 0;

            }, this);

            this.send(Network.Server.Stats, [bytesSend, bytesReceived]);

        }

        BaseNetwork.update(this, type, u);

    },

    bufferedMessage: function(remote, type, data) {

        if (type === Network.Client.Login) {
            this.addPlayer(remote, data);

        } else {
            if (!this.parent.message(remote, type, data)) {

                // Forward to player if left unhandled
                if (remote.player) {
                    remote.player.message(type, data);
                }

            }
        }

    },

    destroy: function() {
        BaseNetwork.destroy(this);
        this._remotes.clear();
    },


    // Ping Calculation -------------------------------------------------------
    ping: function(remote, time, diff) {

        // Drop replies with high latency
        if (diff > Network.Ping.MaxRoundTrip || diff === -1) {
            this.log(remote.toString(), 'Dropped Ping with ', diff, 'ms');
            remote.send([Network.Server.Ping, time % Network.Ping.Range]);

        } else {

            var ping = remote.ping;

            // Keep a sliding window of the roundtrips and clocks
            ping.rt[ping.tick] = diff;
            ping.clock[ping.tick] = [time, this._toPingTime(Date.now())];

            // Fill up the initial buffer
            if (!ping.sliding && ping.tick < Network.Ping.BufferSize - 1) {
                remote.send([Network.Server.Ping, time]);

            // Once the buffer is full calculate ping and clock offset from
            // the sliding window
            } else {

                // Calculate the average latency and clock offsets
                var value = Math.round(this._averageValue(ping.rt) * 0.5),
                    offset = this._averageValue(ping.clock.map(function(val) {
                        return (val[0] + value) - val[1];
                    }));

                // Store Ping and clock offset of the remote
                ping.value = value;
                ping.offset = offset;

                this.log(remote.toString(), '(Ping ' + value + 'ms, Offset ' + offset + 'ms)');

                if (remote.player) {
                    remote.player.setPing(value);
                    this.send(Network.Player.Ping, [remote.player.id, value]);
                }

                // Switch to sliding window buffer
                ping.sliding = true;

                // Schedule periodic pings from here on out
                ping.timeout = setTimeout(
                    this._sendPing.bind(this, Date.now(), remote, time),
                    Network.Ping.Interval
                );

            }

            // Wrap ticks for sliding window
            ping.tick++;

            if (ping.tick >= Network.Ping.BufferSize) {
                ping.tick = 0;
            }

        }

    },

    _sendPing: function(offset, remote, time) {
        remote.send([
            Network.Server.Ping,
            time + this._toPingTime(Date.now() - offset)
        ]);
    },

    _toPingTime: function(t) {
        return t - (t / Network.Ping.Range | 0) * Network.Ping.Range;
    },

    _averageValue: function(values) {

        var deviation = Math.abs(values.reduce(function(p, c) {
            return p + c;

        })) / values.length;

        var normals = values.filter(function(val) {
            return Math.abs(val - deviation) <= deviation * 2;
        });

        if (normals.length === 0) {
            return 0;
        }

        var average = normals.reduce(function(prev, next) {
            return prev + next;
        });

        return Math.round(average / normals.length);

    },


    // Players ----------------------------------------------------------------
    addPlayer: function(remote, data) {

        var player = this.parent.addPlayer(data, true);
        if (player) {

            // Send player to remotes
            this._remotes.each(function(other) {
                other.send([Network.Player.Join.Remote, player.getState(true)]);
            });

            // Send player to itself
            player.send(Network.Player.Join.Local, player.getState(true));

            remote.player = player;
            this._remotes.add(remote);
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

        // Setup Remote Meta Data
        remote.accept();

        // Attach ping meta to remote
        remote.ping = {
            sliding: false,
            rt: new Array(Network.Ping.BufferSize),
            clock: new Array(Network.Ping.BufferSize),
            tick: 0,
            value: 0,
            offset: 0,
            timeout: null
        };

        this.ping(remote, Date.now(), -1);

        // Handle everything else
        BaseNetwork.connection(this, remote);

    },

    message: function(remote, type, data) {

        if (type === Network.Client.Ping) {
            this.ping(remote, data[0], data[1]);

        } else {
            BaseNetwork.message(this, remote, type, data);
        }

    },

    close: function(remote, closedByRemote) {

        if (this._remotes.remove(remote)) {

            this.removePlayer(remote);
            this.parent.close(remote, !closedByRemote);

            clearTimeout(remote.ping.timeout);

            if (closedByRemote) {
                this.log('Disconnected', remote.toString());

            } else {
                this.log('Kicked', remote.toString());
            }

            remote.reset();

        }

    }

});


// Exports --------------------------------------------------------------------
exports.Network = Network;

