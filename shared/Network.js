// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    Component = require('./Component').Component;

"use strict";


// Network Interface ----------------------------------------------------------
var Network = Class(function(parent) {

    Component(this, 'Network', parent);

    // Underlying Network Stack
    this.socket = null;

    // Message Queue
    this.messageQueue = null;

}, Component, {

    // Network Codes ----------------------------------------------------------
    $Entity: {
        Add: 0,
        Owner: 1,
        Update: 2,
        Remove: 3,
        ClientUpdate: 4
    },

    $Player: {

        Ping: 7,

        Join: {
            Local: 10,
            Remote: 11,
        },

        Update: 12,

        Leave: 13

    },

    $Server: {
        Ping: 5,
        Init: 20,
        Stats: 21
    },

    $Client: {
        Ping: 6,
        Login: 30
    },

    // Statics ----------------------------------------------------------------
    $State:  {
        Add: 1,
        Update: 2,
        Remove: 3
    },

    $Ping: {
        Range: 100000,
        BufferSize: 12,
        Interval: 2500,
        MaxRoundTrip: 5000
    },


    // Methods ----------------------------------------------------------------
    init: function() {
        this.messageQueue = [];
    },

    update: function() {
        for(var i = 0, l = this.messageQueue.length; i < l; i++) {
            this.bufferedMessage.apply(this, this.messageQueue[i]);
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
        remote.on('message', this.validateMessage.bind(this, remote));
        remote.on('close', this.close.bind(this, remote));
        this.log('Connected', remote.toString());
        this.parent.connection(remote);
    },

    validateMessage: function(remote, msg) {

        if (msg === undefined || !(msg instanceof Array) || msg.length !== 2) {
            this.log(remote.toString(), 'Invalid Message:', msg);

        } else if (typeof msg[0] !== 'number' || (msg[0] | 0) !== msg[0]) {
            this.log(remote.toString(), 'Invalid Message Type:', msg);

        } else {
            this.message(remote, msg[0], msg[1]);
        }

    },

    message: function(remote, type, data) {
        this.messageQueue.push([remote, type, data]);
    }

});


// Exports --------------------------------------------------------------------
exports.Network = Network;

