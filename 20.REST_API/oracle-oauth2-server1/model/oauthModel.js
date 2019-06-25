'use strict';
var log = require('log4js').getLogger("oauthModel");
var pool = require('./dbConnect');
const async = require('async');
const moment = require('moment');

/*
* Get access token.
*/
module.exports.getAccessToken = function(bearerToken) {
    console.log('called getAccessToken, bearerToken=', bearerToken);
    return new Promise(function(resolve, reject) {
        var query = "";

        query += "SELECT ACCESS_TOKEN, ACCESS_TOKEN_EXPIRES_ON, CLIENT_ID, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRES_ON, USER_ID ";
        query += "FROM oauth_tokens ";
        query += "WHERE ACCESS_TOKEN = '" + bearerToken + "' ";

        console.log(">>getAccessToken : ", query);
        pool.oauthDb(function(err, oauthDb) {
            if(err) {
                console.log(">>getAccessToken.oauthDb.err : ", err);
                reject(err);
            }
            pool.query(oauthDb, query, function(err, results) {
                if ( err ) {
                    console.log(">>getAccessToken.query.err : ", err);
                    reject(err);
                }
                console.log(">>> getAccessToken.results[0] : ", results[0]);
                if(results.length > 0) {
                    var accessToken = {
                        accessToken: results[0]['ACCESS_TOKEN'],
                        client: {id: results[0]['CLIENT_ID']},
                        expires: results[0]['ACCESS_TOKEN_EXPIRES_ON'],
                        user: {id: results[0]['USER_ID']},
                    };
                    console.log(">>> getAccessToken.accessToken : ", accessToken);
                    resolve(accessToken);
                }
                else {
                    console.log(">>> getAccessToken.results[0] : return false ");
                    resolve(false);
                }
            });
        });
    });
};

/**
 * Get refresh token.
 */
module.exports.getRefreshToken = function(bearerToken) {
    console.log('called getRefreshToken, bearerToken=', bearerToken);
    return new Promise(function(resolve, reject) {
        var query = "";

        query += "SELECT ACCESS_TOKEN, ACCESS_TOKEN_EXPIRES_ON, CLIENT_ID, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRES_ON, USER_ID ";
        query += "FROM oauth_tokens ";
        query += "WHERE REFRESH_TOKEN = '" + bearerToken + "' ";

        console.log(">>getRefreshToken : ", query);
        pool.oauthDb(function(err, oauthDb) {
            if(err) {
                console.log(">>getRefreshToken.oauthDb.err : ", err);
                reject(err);
            }
            pool.query(oauthDb, query, function(err, results) {
                if ( err ) {
                    console.log(">>getRefreshToken.query.err : ", err);
                    reject(err);
                }
                console.log(">>> getRefreshToken.results[0] : ", results[0]);
                if(results.length > 0) {
                    var accessToken = {
                        accessToken: results[0]['ACCESS_TOKEN'],
                        client: {id: results[0]['CLIENT_ID']},
                        expires: results[0]['ACCESS_TOKEN_EXPIRES_ON'],
                        user: {id: results[0]['USER_ID']},
                    };
                    console.log(">>> getRefreshToken.accessToken : ", accessToken);
                    resolve(accessToken);
                }
                else {
                    console.log(">>> getRefreshToken.results[0] : return false ");
                    resolve(false);
                }
            });
        });
    });
};

/**
 * Get client.
 */
module.exports.getClient = function(clientId, clientSecret) {
    console.log('called oauthModel.getClient - clientId=', clientId, ', clientSecret=', clientSecret);

    return new Promise(function(resolve, reject) {
        var query = "";
        
          
        query += "SELECT CLIENT_ID, CLIENT_SECRET, REDIRECT_URI  ";
        query += "FROM oauth_clients ";
        query += "where 1=1 ";
        if((clientId != undefined) && (clientId.length > 0)) {
            query += "AND CLIENT_ID = '" + clientId + "' ";
        }
        if((clientSecret != undefined) && (clientSecret > 0)) {
            query += "AND CLIENT_SECRET = '" + clientSecret + "' ";
        }
        console.log(">>getClient : ", query);
        pool.oauthDb(function(err, oauthDb) {
            if(err) {
                console.log(">>getClient.oauthDb.err : ", err);
                reject(err);
            }
            pool.query(oauthDb, query, function(err, results) {
                if ( err ) {
                    console.log(">>getClient.query.err : ", err);
                    reject(err);
                }
                console.log(">>> getClient.results[0] : ", results[0]);
                if(results.length > 0) {
                    var oAuthClient = {
                        clientId: results[0]['CLIENT_ID'],
                        clientSecret: results[0]['CLIENT_SECRET'],
                        grants: ['client_credentials'],
                    };
                    console.log(">>> getClient.oAuthClient : ", oAuthClient);
                    resolve(oAuthClient);
                }
                else {
                    console.log(">>> getClient.results[0] : return false ");
                    resolve(false);
                }
            });
        });
    });
};

/**
 * Save token.
 */
module.exports.saveToken = function(token, client, user) {
    console.log('called saveToken', arguments);
    return new Promise(function(resolve, reject) {
        var newToken = {
            accessToken: token.accessToken,
            accessTokenExpiresAt: token.accessTokenExpiresAt,
            clientId: client.clientId,
            refreshToken: token.refreshToken,
            refreshTokenExpiresAt: token.refreshTokenExpiresAt,
            userId: user.id,

            //these are required in /node_modules/express-oauth-server/node_modules/oauth2-server/lib/models/token-model.js
            client: client,
            user:user,
            scope: null, //where are we taking scope from? maybe client?
        };

        var strAccessTokenExpiresAt=moment(newToken.accessTokenExpiresAt).format("YYYY-MM-DD HH:mm:ss");
        var query = "";
        pool.oauthDb(function(err, oauthDb) {
            if(err) {
                console.log(">>saveToken.oauthDb.err : ", err);
                reject(err);
            }
            
            query += "INSERT INTO oauth_tokens ";
            query += "(ID, ACCESS_TOKEN, ACCESS_TOKEN_EXPIRES_ON, CLIENT_ID, REFRESH_TOKEN, REFRESH_TOKEN_EXPIRES_ON, USER_ID) ";
            query += "VALUES ";
            query += "( SEQ_ID.NEXTVAL ";
            query += ", '" + newToken.accessToken + "'";
            query += ", TO_TIMESTAMP('" + strAccessTokenExpiresAt + "', 'YYYY-MM-DD HH24:MI:SS') ";
            query += ", '" + newToken.clientId + "'";
            if (newToken.refreshToken == undefined) {
                query += ", null ";
            }
            else {
                query += ", '" + newToken.refreshToken + "'";
            }
            if(newToken.refreshTokenExpiresAt == undefined) {
                query += ", null ";
            }
            else {
                query += ", '" + newToken.refreshTokenExpiresAt + "'";
            }
            query += ", -1 ";   // client credentials 이므로, 사용자ID 는 없다
            query += ") ";
            console.log(">>> saveToken: ", query);
            pool.update(oauthDb, query, function(err, results) {
                if ( err ) {
                    log.info('>>> saveToken: Task FAIL : ', query, ", err=", err.message);
                    reject(err);
                }
                else {
                    log.debug('>>> saveToken: Task done : ', query, ", results=", results);
                }
                resolve(newToken);
            });
        });
    });
};

/*
* Get user.
*/
module.exports.getUser = function(username, password) {
    console.log('called prototype.getUser', arguments);

    return new Promise(function(resolve, reject) {
        var query = "";

        query += "SELECT id FROM users ";
        query += "where 1=1 ";
        if((username != undefined) && (username.length > 0)) {
            query += "AND username = '" + username + "' ";
        }
        if((password != undefined) && (password > 0)) {
            query += "AND password = '" + password + "' ";
        }
        console.log(">>getUser : ", query);
        pool.oauthDb(function(err, oauthDb) {
            if(err) {
                console.log(">>getUser.oauthDb.err : ", err);
                reject(err);
            }
            pool.query(oauthDb, query, function(err, results) {
                if ( err ) {
                    console.log(">>getUser.query.err : ", err);
                    reject(err);
                }
                console.log(">>> getUser.results[0] : ", results[0]);
                if(results.length > 0) {
                    console.log(">>> getUser : ", results[0]);
                    resolve(results[0]);
                }
                else {
                    console.log(">>> getUser.results[0] : return false ");
                    resolve(false);
                }
            });
        });
    });
};

module.exports.getUserFromClient = function(client) {
    console.log('called prototype.getUserFromClient', arguments);
    // return db.queryUser({id: client.USER_ID});
    var user = {
        id : client.clientId
    }
    return user;
}

module.exports.saveAuthorizationCode = function(){
    console.log('how is this implemented!?', arguments);
}
