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
        
        const PORT = '3000';
        const BASE_PATH = '/oauth';
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
            
            GetAccessToken : function (basicAuth, body, callback) {
                log.debug(">>> oauthApiCall : basicAuth: ", basicAuth, ", body:", body);
                OPTIONS.url = HOST + ':' + PORT + BASE_PATH + '/token';
                OPTIONS.headers.Authorization = basicAuth;
                OPTIONS.headers["Content-Type"] = 'application/x-www-form-urlencoded';
                OPTIONS.body = body
                log.debug(">>> oauthApiCall : url : ", OPTIONS.url);

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