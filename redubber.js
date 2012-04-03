var _      = require('underscore'),
    pubsub = require('redis-pubsub'),
    Redub  = require('redub');

// DEFAULTS
var DEFAULT_PORT  = 6379;
var DEFAULT_HOST  = 'localhost';
var RETRY_DELAY   = 2000;
var RETRY_BACKOFF = 1.0;

// Create a new Redubber for given channels on given servers.
// Channels and servers may be added later through `addChannel`
// and `addServer`
function Redubber(channels, servers) {
    this.channels = [];
    this.servers  = [];
    this.open     = false;

    // Internal Redub instance
    this.redub = new Redub();

    // Parse channels passed to this constructor
    (channels || []).map(Redubber.prototype.addChannel, this);

    // Parse servers passed to this constructor
    (servers || []).map(Redubber.prototype.addServer, this);
}
exports = module.exports = Redubber;

// Add a `channel` to the Redubber. This channel will be added to
// all servers known to the Redubber.
Redubber.prototype.addChannel = function(channel) {
    if (-1 === this.channels.indexOf(channel)) {
        this.channels.push(channel);

        // Check if we need to connect the channel right away
        if (false !== this.open) {

        }
    }

    return this;
};

// Add a server to the Redubber. All known channels will be added
// to the `server`.
Redubber.prototype.addServer = function(spec) {

    // search for existing server
    var existing = _(this.servers).find(function(existingServer) {
        existingSpec = existingServer.host + ':' + existingServer.port;
        return (existingSpec === spec);
    });

    // Create a new server when no existing server was found
    if (!existing) {
        var server = parseAddressSpec(spec);
        server.channels = {};
        this.servers.push(server);

        // Check if we need to connect the server right away
        if (false !== this.open) {

        }
    }
    return this;
};

// Listen for messages on all channels and servers
Redubber.prototype.listen = function(callback) {
    this._open(function() {
        var redub = this.redub;
        this.channels.forEach(function(channel) {
            redub.on('message', function(message) {
                callback(channel, message);
            });
        });
    });
};

// Send a message to the Redubber servers on the selected channel.
// When no channel is given the message will be send to all channels.
Redubber.prototype.send = function(message, channel) {
    channel = channel || null;
    var channels;

    this._open(function() {
        this.redub.send(message);
    });

    // SHORTCUT, REDUB DOES NOT SUPPORT CHANNELS OR `wrap`
    return this;

    // check if we need to limit to specific channel ...
    if (_.isString(channel)) {
        // Find the channels with the correct name
        var channels = _(this.channels).find(function(knownChannel) {
            return knownChannel.chan === channel;
        });
    }
    // or use all channels
    else {
        channels = this.channels;
    }

    // send a wrapped message to each channel
    channels.forEach(function(channel) {
        channel.send(this.redub.wrap(message));
    });

    return this;
};

// Open the redis channels on each server
Redubber.prototype._open = function(callback) {

    if (false === this.open) {
        var channels = this.channels
          , redub    = this.redub
          , self     = this;

        // Create channels for each server
        this.servers.forEach(function(server) {
            var knownChannels = _(server).keys();

            // Limit the channels to the ones that the server doesn't know
            _.chain(channels).without(knownChannels).each(function(channel) {
                var pubsubChannel = pubsub.createChannel(server.port, server.host, channel);
                server.channels[channel] = pubsubChannel;

                pubsubChannel.on('ready', function() {
                    console.log('Channel %s ready on %s:%s', channel, server.host, server.port);
                });
                pubsubChannel.on('error', function() {
                    console.log('Error on channel %s on connection %s:%s', channel, server.host, server.port);
                });
                pubsubChannel.on('close', function() {
                    console.log('Channel %s closed on %s:%s', channel, server.host, server.port);
                });

                redub.add(pubsubChannel);
            });
        });

        this.open = true;
    }

    if (callback) {
        callback.apply(this);
    }
};

Redubber.prototype.close = function() {
    this.redub.end();
};

// Attach a channel to a server
Redubber.prototype._attachChannel = function(channel, server) {

};

// Parse a `host:port` spec into a separate values.
// This function will always return a hash with `host` and `port`
// available. When the spec is incomplete these will be filled
// with defaults
function parseAddressSpec(address) {
    var addressSplit = address.split(':', 2);

    return {
        port: addressSplit[1] || DEFAULT_PORT,
        host: addressSplit[0] || DEFAULT_HOST
    };
}

