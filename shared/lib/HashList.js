"use strict";

// Hash List Utility Class -----------------------------------------------------
function HashList(max) {
    this.maximum = max || -1;
    this.clear();
}


// Methods --------------------------------------------------------------------
HashList.prototype = {

    // General Methods ---------------------------------------------------------
    clear: function() {
        this.hash = new Object();
        this.items = [];
        this.length = 0;
    },

    destroy: function() {
        this.hash = null;
        this.items = null;
        this.length = 0;
    },

    isFull: function() {
        return this.maximum === -1 ? false : this.length === this.maximum;
    },


    // Index based Methods -----------------------------------------------------
    contains: function(item) {
        return this.items.indexOf(item) !== -1;
    },

    indexOf: function(item) {
        return this.items.indexOf(item);
    },

    at: function(index) {
        return this.items[index];
    },


    // ID based methods --------------------------------------------------------
    has: function(obj) {

        if (typeof obj !== 'object') {
            return obj in this.hash;

        } else {
            return obj.id in this.hash;
        }

    },

    get: function(obj) {

        if (typeof obj !== 'object') {
            return this.hash[obj];

        } else {
            return this.hash[obj.id];
        }

    },

    add: function(obj) {

        if (!this.has(obj) && !this.isFull()) {
            this.hash[obj.id] = obj;
            this.items.push(obj);
            this.length++;

            return obj;

        } else {
            console.error('(HashList) Add of contained object', obj);
            return false;
        }

    },

    put: function(id, obj) {

        if (!this.has(id) && !this.isFull()) {
            this.hash[id] = obj;
            this.items.push(obj);
            this.length++;
            return obj;

        } else {
            return false;
        }

    },

    remove: function(obj) {

        obj = this.get(obj);

        if (obj) {
            this.items.splice(this.items.indexOf(obj), 1);
            delete this.hash[obj.id];
            this.length--;
            return obj;

        } else {
            console.error('(HashList) Remove of uncontained object', obj);
            return false;
        }

    },


    // Sorting -----------------------------------------------------------------
    sort: function(func) {
        this.items.sort(func);
        return this;
    },


    // Iteration ---------------------------------------------------------------
    each: function(cb, scope) {
        for(var i = 0; i < this.length; i++) {
            var oldLength = this.length;
            var item = this.items[i];
            if (cb.call(scope || item, item)) {
                return true;
            }
            if (this.length < oldLength) {
                i--;
            }
        }
    },

    eachIn: function(items, cb, scope) {
        for(var i = 0; i < this.length; i++) {

            var oldLength = this.length,
                item = this.items[i];

            if (items.indexOf(item) !== -1) {
                if (cb.call(scope || item, item)) {
                    return true;
                }
                if (this.length < oldLength) {
                    i--;
                }
            }

        }
    },

    eachNot: function(items, cb, scope) {
        for(var i = 0; i < this.length; i++) {

            var oldLength = this.length,
                item = this.items[i];

            if (items.indexOf(item) === -1) {
                if (cb.call(scope || item, item)) {
                    return true;
                }
                if (this.length < oldLength) {
                    i--;
                }
            }

        }
    },

    eachCall: function(method) {
        for(var i = 0; i < this.length; i++) {
            this.items[i][method]();
        }
    },

    eachEach: function(check, func, after, scope) {
        for(var i = 0; i < this.length; i++) {

            var oldLength = this.length,
                item = this.items[i];

            if (check.call(scope || item, item)) {
                for(var e = i + 1;; e++) {
                    var oldLengthInner = this.length;
                    if (e === this.length) {
                        e = 0;
                    }
                    if (e === i) {
                        break;
                    }

                    var itemInner = this.items[e];
                    if (func.call(scope || itemInner, item, itemInner)) {
                        break;
                    }
                    if (this.length < oldLengthInner) {
                        e--;
                    }
                }
                after.call(scope || item, item);
            }
            if (this.length < oldLength) {
                i--;
            }

        }
    }

};


// Exports --------------------------------------------------------------------
exports.HashList = HashList;

