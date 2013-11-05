// Dependencies ---------------------------------------------------------------
var Class = require('../shared/lib/Class').Class,
    BaseNetwork = require('../shared/Network').Network,

    // External
    lithium = require('lithium/client/lithium').lithium,
    BISON = require('bisonjs');


// Client Side Network Abstraction --------------------------------------------
var Network = Class(function(parent) {
    BaseNetwork(this, parent);

}, BaseNetwork, {

    // Methods ----------------------------------------------------------------
    init: function(port, host) {

        BaseNetwork.init(this, port, host);

        this.socket = new lithium.Client(
            this.connection.bind(this),
            BISON.encode,
            BISON.decode
        );

        this.socket.connect(port, host);

    },

    message: function(client, type, data) {

        // Player
        if (type === Network.Player.Join.Local) {
            this.parent.addPlayer(data, false);

        } else if (type === Network.Player.Join.Remote) {
            this.parent.addPlayer(data, true);

        } else if (type === Network.Player.Leave) {
            this.parent.removePlayer(data[0]);

        // Other
        } else {
            this.parent.message(client, type, data);
        }

    },


    // Network Events ---------------------------------------------------------
    bufferMessage: function(remote, msg) {

        // Initialization
        // TODO this is ugly... should not directly call the client here
        // move to message buffer and allow to skip any futher messages
        // from processing?
        if (msg[0] === Network.Server.Init) {
            this.parent.start(msg[1]);

        } else {
            BaseNetwork.bufferMessage(this, remote, msg);
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

