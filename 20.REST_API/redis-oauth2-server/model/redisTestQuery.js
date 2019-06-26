'use strict';

var redis = require('redis');
var bluebird = require('bluebird');

bluebird.promisifyAll(redis.RedisClient.prototype);
bluebird.promisifyAll(redis.Multi.prototype);

const db = redis.createClient({
    url : "redis://:password@192.168.0.208:6379/1"
});
var fmt = require('util').format;

var formats = {
    client: 'clients:%s',
    token: 'tokens:%s',
    user: 'users:%s'
};

var clientId = "client";
var clientSecret = "secret";

db.on('ready',function() {
    console.log(" subs Redis is ready");
    });

console.log('called prototype.getClient', clientId);
db.hgetall(fmt(formats.client, clientId), (function(err, client) {
                if (!client || client.clientSecret !== clientSecret) {
                    return;
                }
                console.log("clientId:", client.clientId, ", clientSecret:", client.clientSecret);
            })
);

console.log(">>> test");
db.hgetallAsync(fmt(formats.client, clientId))
            .then(function(res) {
                console.log("res=", res);
            });
console.log(">>>> test done....");
