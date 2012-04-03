var _      = require('underscore'),
    pubsub = require('redis-pubsub'),
    Redub  = require('redub');

// DEFAULTS
var DEFAULT_PORT = 6379;
var DEFAULT_HOST = 'localhost';

/**
 * Parse a host:port spec into a separate values. Defaults will always be supplied
 * @param {String} address
 * @return Object
 */
function parseAddressSpec(address) {
    var addressSplit = address.split(':', 2);

    return {
        port: addressSplit[1] || DEFAULT_PORT,
        host: addressSplit[0] || DEFAULT_HOST
    };
}

/**
 * Spy on one or more redis servers
 * @param {Array} servers
 */
function Redubber(servers) {
    this.connections = []; // Server connections
    this.channels    = []; // Channel names across all connections

    // Redub for managing multiple servers
    this.redub = new Redub();

    // Parse servers passed to this constructor
    (servers || []).map(Redubber.prototype.addServer, this);
}

Redubber.prototype.listen = function(listener) {
    var redub = this.redub;
    this.channels.forEach(function(channel) {
        redub.on('message', function(message) {
            listener(channel, message);
        });
    });
};

/**
 * Add a server to the Redis Spy
 * @param {Object|String} config
 * @return Redubber
 */
Redubber.prototype.addServer = function(config) {
    var server = this.parseServer(config);
    if (false === server) {
        return this;
    }

    var channelNames = [], redub = this.redub;
    server.channels.forEach(function(config) {
        // Create a new PubSub channel
        var channel = pubsub.createChannel(server.port, server.host, config.name);
        //channel.raw = config.raw;

        channel.on('ready', function() {
            console.log('Connection to ' + server.host + ':' + server.port + ' is ready');
        });

        // Add it to Redub
        redub.add(channel);

        // Register the channel name
        channelNames.push(config.name);
    });

    // Filter channel names
    this.channels = _(this.channels).union(channelNames);

    return this;
};

/**
 * Parse a server configuration into a server object
 * @param {Object} config
 * @return Object
 */
Redubber.prototype.parseServer = function(config) {
    var server = {}, address, channels;

    // String type server config
    if (typeof(config) === 'string') {
        // Split channels from address
        var channelSplit = config.split('#', 2);

        // Parse the address
        address  = parseAddressSpec(channelSplit[0]);
        server.port = address.port || DEFAULT_PORT;
        server.host = address.host || DEFAULT_HOST;

        // Split channels
        channels = (channelSplit[1] || '').split(',').map(function(channel) { return channel.trim(); });
    }
    // Server config object
    else {
        if (config.host) {
            server.host = config.host;
            server.port = config.port || DEFAULT_PORT;
        }
        else if (config.address) {
            address  = parseAddressSpec(config.address);
            server.port = address.port || DEFAULT_PORT;
            server.host = address.host || DEFAULT_HOST;
        }
        else {
            return false;
        }

        //address  = server.address;
        channels = config.channels || [];
    }

    // Parse all channels
    server.channels = [];
    channels.forEach(function(channel) {

        // Channel as object
        if (typeof(channel) === 'object') {
            if (!channel.name) return;

            // Push the channel on the stack
            server.channels.push({ "name": channel.name, "raw": channel.raw || false });
        }
        else if (typeof(channel) === 'string') {
            // Check for raw option
            var raw = false;
            if ((channel.length - 4) === channel.indexOf(':raw')) {
                raw = true;
                channel = channel.substring(0, channel.length - 4);
            }

            // Push the channel on the stack
            server.channels.push({ "name": channel, "raw": raw });
        }
    });

    return server;
};


// our awesome export products
exports = module.exports = Redubber;
