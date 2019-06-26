'use strict';
var log = require('log4js').getLogger("oauthModel");

// connect to Redis
const redis = require('redis')
const Promise = require('bluebird')

Promise.promisifyAll(redis);

const REDIS_URL = process.env.REDIS_URL || "redis://:password@192.168.0.208:6379/1";
const db = redis.createClient(REDIS_URL);

var fmt = require('util').format;

var formats = {
    client: 'clients:%s',
    token: 'tokens:%s',
    user: 'users:%s'
};

var getAccessToken = function(bearerToken) {
    log.info('called prototype.getAccessToken', arguments);
    return db.hgetallAsync(fmt(formats.token, bearerToken))
            .then(function(token) {
                if (!token) {
                    return false;
                }
  
                return {
                    accessToken: token.accessToken,
                    clientId: token.clientId,
                    expires: token.accessTokenExpiresOn,
                    userId: token.userId
                };
            });
};

var getClient = function(clientId, clientSecret) {
    log.info('called prototype.getClient', arguments);
    return db.hgetallAsync(fmt(formats.client, clientId))
            .then(function(client) {
                if (!client || client.clientSecret !== clientSecret) {
                    return;
                }

                var oAuthClient = {
                    clientId: client.clientId,
                    clientSecret: client.clientSecret,
                    grants: ['client_credentials'],
                    accessTokenLifetime: 1000,
                };
                log.info(">>> getClient.oAuthClient : ", oAuthClient);
                return (oAuthClient);
            });
};

var getRefreshToken = function(bearerToken) {
    log.info('called prototype.getRefreshToken', arguments);
    return db.hgetallAsync(fmt(formats.token, bearerToken))
            .then(function(token) {
                if (!token) {
                    return;
                }
    
                return {
                    clientId: token.clientId,
                    expires: token.refreshTokenExpiresOn,
                    refreshToken: token.accessToken,
                    userId: token.userId
                };
            });
};

var getUser = function(username, password) {
    log.info('called prototype.getUser', arguments);
    return db.hgetallAsync(fmt(formats.user, username))
            .then(function(user) {
                if (!user || password !== user.password) {
                    return;
                }
    
                return {
                    id: username
                };
            });
};

var saveToken = function(token, client, user) {
    log.info('called prototype.saveToken', arguments);
    var data = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        clientId: client.clientId,
        refreshToken: (token.refreshToken == undefined) ? "" : token.refreshToken,
        refreshTokenExpiresAt: (token.refreshTokenExpiresAt == undefined) ? "" : token.refreshTokenExpiresAt,
        userId: user.id,

        //these are required in /node_modules/express-oauth-server/node_modules/oauth2-server/lib/models/token-model.js
        client: client.clientId,
        user: user.id,
        scope: token.scope,
    };

    return Promise.all([
                db.hmset(fmt(formats.token, token.accessToken), data),
                db.expire(fmt(formats.token, token.accessToken), client.accessTokenLifetime),
                //db.hmset(fmt(formats.token, token.refreshToken), data)
            ]).return(data);
};

var getUserFromClient = function(client) {
    log.info('called prototype.getUserFromClient', arguments);
    var user = {
        id : client.clientId
    }
    return user;
}

var validateScope = function(user, client, scope) {
    log.info('called prototype.validateScope', arguments);
    return db.hgetallAsync(fmt(formats.client, client.clientId))
            .then(function(resClient) {
                if (!resClient || resClient.clientSecret !== client.clientSecret) {
                    return;
                }
                log.info(">>> validateScope.scope : ", resClient.scope);
                return (resClient.scope);
            });
}

var verifyScope = function(token, scope) {
    log.info('called prototype.verifyScope', arguments);
    if (!token.scope) {
        return false;
    }
    let requestedScopes = scope.split(',');
    let authorizedScopes = token.scope.split(',');
    return requestedScopes.every(s => authorizedScopes.indexOf(s) >= 0);
}
  
module.exports = {
    getAccessToken: getAccessToken,
    getClient: getClient,
    getRefreshToken: getRefreshToken,
    getUser: getUser,
    saveToken: saveToken,
    getUserFromClient: getUserFromClient,
    validateScope: validateScope,
    verifyScope: verifyScope,
}