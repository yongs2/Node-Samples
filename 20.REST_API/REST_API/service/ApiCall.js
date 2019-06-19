'use strict';

var log = require('log4js').getLogger("ApiCall");
var request = require('request');

module.exports = function (callee) {
    
    function ApiCall(callee) {
        var OPTIONS = {
            headers: {'Content-Type': 'application/json'},
            url: null,
            body: null
        };
        
        const PORT = '8080';
        const BASE_PATH = '/api';
        var HOST = null;
        
        (function () {
            log.debug(">>> ApiCall : callee : ", callee);
            switch (callee) {
                case 'dev':
                    HOST = 'http://dev-api.com';
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
            
            getWorkTime : function (startDate, endDate, callback) {
                log.debug(">>> ApiCall : startDate : ", startDate, ", endDate:", endDate);
                OPTIONS.url = HOST + ':' + PORT + BASE_PATH + '/getWorkTime.do';
                OPTIONS.url += "?START_DATE=" + startDate;
                OPTIONS.url += "&END_DATE=" + endDate;
                log.debug(">>> ApiCall : url : ", OPTIONS.url);

                request.get(OPTIONS, function (err, res, result) {
                    statusCodeErrorHandler(res.statusCode, callback, result);
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
                callback(null, {"result":-1, "resultString":"FAIL"});
                break;
        }
    }
    
    var INSTANCE;
    if (INSTANCE === undefined) {
        INSTANCE = new ApiCall(callee);
    }
    return INSTANCE;
};