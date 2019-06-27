'use strict';

var log = require('log4js').getLogger("oauthApiCall");
var request = require('request');
var createError = require('http-errors');

module.exports = function (callee) {
    
    function oauthApiCall(callee) {
        var OPTIONS = {
            headers: {'Content-Type': 'application/json'},
            url: null,
            body: null
        };
        
        const PORT = '3001';
        const BASE_PATH = '/v1';
        var HOST = null;
        
        (function () {
            log.debug(">>> oauthApiCall : callee : ", callee);
            switch (callee) {
                case 'dev':
                    HOST = 'http://localhost';
                    break;
                case 'prod':
                    HOST = 'http://prod-api.com';
                    break;
                case 'another':
                    HOST = 'http://localhost';
                    break;
                default:
                    HOST = 'http://localhost';
            }
        })(callee);
        
        return {
            
            validAccessToken : function (token, callback) {
                log.debug(">>> oauthApiCall : token : ", token);
                OPTIONS.url = HOST + ':' + PORT + BASE_PATH + '/tokeninfo';
                OPTIONS.url += "?access_token=" + token;
                log.debug(">>> oauthApiCall : url : ", OPTIONS.url);

                request.get(OPTIONS, function (err, res, result) {
                    if(err) {
                        callback(err);
                    }
                    else {
                        log.info(">>> validAccessToken : status=", res.statusCode, ", result=", result);
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