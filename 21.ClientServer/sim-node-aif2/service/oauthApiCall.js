'use strict';

var log = require('log4js').getLogger("oauthApiCall");
var config = require('../config');
var request = require('request');
var createError = require('http-errors');

module.exports = function (callee) {
    
    function oauthApiCall(callee) {
        var OPTIONS = {
            headers: {'Content-Type': 'application/json'},
            url: null,
            body: null
        };
                
        return {
            GetAccessToken : function(callback) {
                var body = {
                    grantType : 'password',
                    userName : config.USER.NAME,
                    password : config.USER.PASSWORD,
                    clientId : config.CLIENT.ID,
                    clientSecret : config.CLIENT.SECRET,
                };

                log.info(">>> oauthApiCall : body:", body);
                OPTIONS.url = config.OAUTH.URL + '/token';
                OPTIONS.body = JSON.stringify(body);
                log.info(">>> oauthApiCall : url : ", OPTIONS.url);

                request.post(OPTIONS, function (err, res, result) {
                    if(err) {
                        callback(err);
                    }
                    else {
                        log.info(">>> GetAccessToken : status=", res.statusCode, ", result=", result);
                        statusCodeErrorHandler(res.statusCode, callback, result);
                    }
                });
            }
        };
    }
    
    function statusCodeErrorHandler(statusCode, callback , data) {
        switch (statusCode) {
            case 200:
                callback(null, JSON.parse(data));
                break;
            default:
                callback(createError(statusCode));
                break;
        }
    }
    
    var INSTANCE;
    if (INSTANCE === undefined) {
        INSTANCE = new oauthApiCall(callee);
    }
    return INSTANCE;
};