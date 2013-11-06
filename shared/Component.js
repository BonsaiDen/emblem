// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class;

"use strict";


// Abstract Game Component Class ----------------------------------------------
var Component = Class(function(ident, parent) {
    this.ident = ident;
    this.id = ++Component.uID;
    this.parent = parent;

}, {

    $uID: 0,

    getId: function() {
        return this.id;
    },

    update: function(type, time, u) {
        throw new TypeError('Component.update() is abstract for ' + this);
    },

    render: function(time, u) {
        throw new TypeError('Component.render() is abstract for ' + this);
    },

    getState: function() {
        throw new TypeError('Component.getState() is abstract for ' + this);
    },

    setState: function() {
        throw new TypeError('Component.setState() is abstract for ' + this);
    },

    destroy: function() {
        throw new TypeError('Component.destroy() is abstract for ' + this);
    },

    log: function() {

        var msg = Array.prototype.slice.call(arguments);
        msg.unshift('[' + this.ident + ' #' + this.id + ']');

        if (this.parent) {
            this.parent.log.apply(this.parent, msg);

        } else {
            console.log.apply(console, msg.map(function(val) {

                if (val && val.constructor === Object) {
                    return val;

                } else if (val) {
                    return val.toString();

                } else {
                    return val;
                }

            }));
        }

    },

    toString: function() {
        return '[' + this.ident + ' #' + this.id + ']';
    }

});


// Exports --------------------------------------------------------------------
exports.Component = Component;

