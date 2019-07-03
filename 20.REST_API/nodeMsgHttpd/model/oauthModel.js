'use strict';
var log = require('log4js').getLogger("oauthModel");
var config = require('../config');

var jwt = require('jsonwebtoken');

// connect to Redis
const redis = require('redis')
const Promise = require('bluebird')

Promise.promisifyAll(redis);

const db = redis.createClient(config.REDIS.URL);

var fmt = require('util').format;

var formats = {
    client: config.REDIS.AUTH_NAME + '%s',
    token: 'tokens:%s',
    user: config.REDIS.AUTH_NAME + '%s'
};

db.on("error", function (err) {
    console.log("Error " + err);
});

var getAccessToken = function(bearerToken, callback) {
    log.info('called prototype.getAccessToken', arguments);
    db.hgetallAsync(fmt(formats.token, bearerToken))
        .then(function(token) {
            if (!token) {
                callback(false);
            }
            else {
                callback(null, {
                    accessToken: token.accessToken,
                    clientId: token.clientId,
                    expires: token.accessTokenExpiresAt,
                    userId: token.userId
                });
            }
        })
        .catch((error) => {
            log.info(">>getAccessToken.promise.err : ", error);
            callback(false);
        });
};

var getClient = function(clientId, clientSecret, callback) {
    log.info('called prototype.getClient', arguments);
    db.hgetallAsync(fmt(formats.client, clientId))
        .then(function(client) {
            log.debug('getClient.hgetallAsync(', fmt(formats.client, clientId), ")=", client);
            if (!client) { // || client.clientSecret !== clientSecret) {
                callback(false);
            }
            else {
                var oAuthClient = {
                    id: clientId,
                    grants: ['password'],
                    accessTokenLifetime: 1000,
                    refreshTokenLifetime: 3600,
                };
                log.debug(">>> getClient.oAuthClient : ", oAuthClient);
                callback(null, oAuthClient);
            }
        })
        .catch((error) => {
            log.info(">>getClient.promise.err : ", error);
            callback(false);
        });
};

var getRefreshToken = function(bearerToken, callback) {
    log.info('called prototype.getRefreshToken', arguments);
    db.hgetallAsync(fmt(formats.token, bearerToken))
        .then(function(token) {
            if (!token) {
                callback(false);
            }
            else {
                callback(null, {
                    clientId: token.clientId,
                    expires: token.refreshTokenExpiresOn,
                    refreshToken: token.accessToken,
                    userId: token.userId
                });
            }
        })
        .catch((error) => {
            log.info(">>getRefreshToken.promise.err : ", error);
            callback(false);
        });
};

var getUser = function(username, password, callback) {
    log.info('called prototype.getUser', arguments);
    db.hgetallAsync(fmt(formats.user, username))
        .then(function(user) {
            if (!user) { // || password !== user.password) {
                callback(false);
            }
            else {
                callback(null, {
                    id: username
                });
            }
        })
        .catch((error) => {
            log.info(">>getUser.promise.err : ", error);
            callback(false);
        });
};

var saveToken = function(token, client, user) {
    log.info('called prototype.saveToken', arguments);
    var data = {
        accessToken: token.accessToken,
        accessTokenExpiresAt: token.accessTokenExpiresAt,
        clientId: client.id,
        refreshToken: (token.refreshToken == undefined) ? "" : token.refreshToken,
        refreshTokenExpiresAt: (token.refreshTokenExpiresAt == undefined) ? "" : token.refreshTokenExpiresAt,
        userId: user.id,

        //these are required in /node_modules/express-oauth-server/node_modules/oauth2-server/lib/models/token-model.js
        client: client.id,
        user: user.id,
        scope: token.scope,
    };

    // JWT
    var jwtToken = jwt.sign(
        {
            "iss": config.JWT.ISS,  // iss: 토큰 발급자
            "exp": Math.floor(token.accessTokenExpiresAt.getTime() / 1000),
            "accessToken": token.accessToken,
            "clientId": client.id
        }
        , config.JWT.SECRET
        , { algorithm: 'HS256' });
    data.accessToken = jwtToken;
    log.debug(">>> saveToken:token.accessToken=", data.accessToken);

    return Promise.all([
                db.hmset(fmt(formats.token, token.accessToken), data),
                db.hset(fmt(formats.client, client.id), "jwtToken", data.accessToken),
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

var validateScope = function(user, client, scope, callback) {
    log.info('called prototype.validateScope', arguments);
    db.hgetallAsync(fmt(formats.client, client.id))
        .then(function(resClient) {
            log.debug('getClient.validateScope(', fmt(formats.client, client.id), ")=", resClient);
            if (!resClient) { // || resClient.clientSecret !== client.clientSecret) {
                callback(false);
            }
            else {
                log.debug(">>> validateScope.scope : ", scope);
                callback(null, (scope));
            }
        })
        .catch((error) => {
            log.info(">>validateScope.promise.err : ", error);
            callback(false);
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

var validAccessToken = function(bearerToken, callback) {
    log.info('called prototype.validAccessToken', arguments);
    db.hgetallAsync(fmt(formats.token, bearerToken))
        .then(function(token) {
            if (!token) {
                callback(false);
            }
            else {
                callback(null, {
                    accessToken: token.accessToken,
                    clientId: token.clientId,
                    expires: token.accessTokenExpiresAt,
                    userId: token.userId,
                    scope: token.scope
                });
            }
        })
        .catch((error) => {
            log.info(">>validAccessToken.promise.err : ", error);
            callback(false);
        });
};

module.exports = {
    getAccessToken: getAccessToken,
    getClient: getClient,
    getRefreshToken: getRefreshToken,
    getUser: getUser,
    saveToken: saveToken,
    getUserFromClient: getUserFromClient,
    validateScope: validateScope,
    verifyScope: verifyScope,
    validAccessToken: validAccessToken,
}