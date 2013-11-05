// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    Component = require('./Component').Component;


// Network Interface ----------------------------------------------------------
var Network = Class(function(parent) {

    Component(this, 'Network', parent);

    // Underlying Network Stack
    this.socket = null;

    // Message Queue
    this.messageQueue = null;

}, Component, {

    // Statics ----------------------------------------------------------------
    $Entity: {
        Add: 0,
        Owner: 1,
        Update: 2,
        Remove: 3,
        ClientUpdate: 4
    },

    $Player: {

        Join: {
            Local: 10,
            Remote: 11,
        },

        Update: 12,

        Leave: 13

    },

    $Server: {
        Init: 20,
        Stats: 21
    },

    $Client: {
        Login: 30
    },


    // Methods ----------------------------------------------------------------
    init: function() {
        this.messageQueue = [];
    },

    update: function() {
        for(var i = 0, l = this.messageQueue.length; i < l; i++) {
            this.message.apply(this, this.messageQueue[i]);
        }
        this.messageQueue.length = 0;
    },

    destroy: function() {
        this.messageQueue.length = 0;
        this.socket.close();
    },


    // Network ----------------------------------------------------------------
    send: function(type, msg) {
        this.socket.send([type, msg]);
    },

    connection: function(remote) {
        remote.on('message', this.bufferMessage.bind(this, remote));
        remote.on('close', this.close.bind(this, remote));
        this.log('Connected', remote.toString());
        this.parent.connection(remote);
    },

    bufferMessage: function(remote, msg) {
        // TODO Validate message structure
        this.messageQueue.push([remote, msg[0], msg[1]]);
    }

});


// Exports --------------------------------------------------------------------
exports.Network = Network;

