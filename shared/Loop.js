// Dependencies ---------------------------------------------------------------
var Class = require('./lib/Class').Class,
    requestAnimationFrame = require('./lib/animationFrame').requestAnimationFrame,
    Component = require('./Component').Component;


// Shared Game Loop Implementation --------------------------------------------
var Loop = Class(function(parent, fps, update, render, scope) {

    Component(this, 'Loop', parent);

    this.fps = fps;
    this.tps = 1000 / fps;
    this.isRunning = false;
    this.interval = null;

    this.startTime = 0;
    this.lastUpdate = 0;
    this.lastRender = 0;
    this.tickBuffer = 0;
    this.tickCount = 0;

    this.updateCallback = update;
    this.renderCallback = render;
    this.scope = scope || null;

}, Component, {

    // Statics ----------------------------------------------------------------
    $Update:  {
        Normal: 0,
        Tick: 1
    },


    // Methods ----------------------------------------------------------------
    start: function() {

        this.isRunning = true;
        this.interval = setInterval(this.update.bind(this), this.tps / 2);

        this.startTime = Date.now();
        this.lastUpdate = this.startTime;
        this.lastRender = this.startTime;
        this.tickBuffer = 0;
        this.tickCount = 0;

        if (this.renderCallback) {
            this.render(this.startTime);
        }

    },

    stop: function() {
        this.updateCallback.call(this.scope, Loop.Update.Normal, Date.now() - this.startTime, 0);
        clearInterval(this.interval);
        this.isRunning = false;
    },

    update: function() {

        var time = Date.now(),
            passed = time - this.startTime,
            tickCount = Math.floor(passed / this.tps);

        if (tickCount > this.tickCount) {

            var u = this.tps * (tickCount - this.tickCount) / 100;
            this.updateCallback.call(this.scope, Loop.Update.Normal, passed, u);

            this.tickBuffer += time - this.lastUpdate;

            if (this.tickBuffer > 1000) {
                this.updateCallback.call(this.scope, Loop.Update.Tick, passed, u);
                this.tickBuffer = 0;
            }

            this.lastUpdate = time;
            this.tickCount = tickCount;

        }

    },

    render: function() {

        if (this.isRunning) {

            requestAnimationFrame(this.render.bind(this));

            var time = Date.now();
            if (time - this.lastRender > 16) {
                var u = 1.0 / this.tps * (time - this.lastUpdate);
                this.renderCallback.call(this.scope, time - this.startTime, u);
                this.lastRender = time;
            }

        }

    }

});


// Exports --------------------------------------------------------------------
exports.Loop = Loop;

