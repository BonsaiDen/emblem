// Custom 2D Vector for Entities ----------------------------------------------
function EntityVector(x, y, r) {
    this.x = x || 0; // In pixels
    this.y = y || 0; // In pixels
    this.r = r || 0; // In degrees
}


// Statics --------------------------------------------------------------------
EntityVector.degreeDiff = function(x, y) {

    // TODO clean up and remove need for conversion
    var a = (x * Math.PI / 180) - Math.PI,
        b = (y * Math.PI / 180) - Math.PI;

    return Math.round(
        Math.atan2(
            Math.sin(b - a),
            Math.cos(b - a)

        ) * (180 / Math.PI)
    );

};


// Methods --------------------------------------------------------------------
EntityVector.prototype = {

    set: function(x, y, r) {
        this.x = x;
        this.y = y;
        this.r = r;
        return this;
    },

    setFromVector: function(other) {
        this.x = other.x;
        this.y = other.y;
        this.r = other.r;
        return this;
    },

    add: function(other) {
        this.x = this.x + other.x;
        this.y = this.y + other.y;
        this.r = (this.r + other.r) % 360;
        return this;
    },

    mul: function(m) {
        this.x *= m;
        this.y *= m;
        this.r = (this.r * m) % 360;
        return this;
    },

    subtract: function(other) {
        return new EntityVector(
            other.x - this.x,
            other.y - this.y,
            -EntityVector.degreeDiff(other.r, this.r)
        );
    },

    limit: function(speed, angular) {

        var ds = Math.min(Math.sqrt(this.x * this.x + this.y * this.y), speed),
            dr = Math.atan2(this.y, this.x);

        this.x = Math.cos(dr) * ds;
        this.y = Math.sin(dr) * ds;
        this.r = this.r > 0 ? Math.min(this.r, angular)
                            : Math.max(this.r, -angular);

        return this;

    },

    round: function() {
        this.x = Math.round(this.x);
        this.y = Math.round(this.y);
        this.r = Math.round(this.r);
        return this;
    }

};


// Exports --------------------------------------------------------------------
exports.EntityVector = EntityVector;

