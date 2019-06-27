'use strict';

var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger("api");
const MultiAnnounce = require('../model/MultiAnnounce');
const ApiCall = require('../service/ApiCall')('dev');
var passport = require('passport');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendStatus(501); // Not implemented
});

function checkScope(allowScope, resScope) {
    let resScopes = resScope.split(',');
    let allowScopes = allowScope.split(',');
    if(resScopes.every(s => allowScopes.indexOf(s) < 0)) throw Error("Req.InvalidScope.allow:" + allowScope + ", resp:" + resScope);
}

function checkValidObjectParam(obj, paramName) {
    if (obj[paramName] == undefined || obj[paramName].length <= 0) throw Error("Req." + paramName + ' is NULL')
}

function checkValidArrayParam(arr, idx, paramName) {
    if (arr[idx][paramName] == undefined || arr[idx][paramName].length <= 0) throw Error("Req." + idx + '.' + paramName + ' is NULL')
}

router.get("/getMultiAnnounce", 
    passport.authenticate('bearer', { session: false }),
    function (req, res, next) { // GET 이므로, req.query
	    log.debug(">>> getMultiAnnounce : req.query : ", req.query, ",body=", req.body, ",user=", req.user);
	    log.debug(">>> oauth: ", req.headers.authorization);

        checkScope("read", req.user.scope);
	    checkValidObjectParam(req.query, 'START_DATE');
	    checkValidObjectParam(req.query, 'END_DATE');

	    MultiAnnounce.getMultiAnnounceList(req.query, function(err, result) {
	        if(err) {
	            return next(err);
	        }
	        res.send(result);
	    });
});

router.post('/insertMultiAnnounce', 
    passport.authenticate('bearer', { session: false }),
    function (req, res, next) {  // POST 이므로, req.body
    log.debug(">>> insertMultiAnnounce : req.body : ", typeof(req.body), ", Con=", req.body.constructor, ", Len=", req.body.length);
    
    checkScope("write", req.user.scope);

    if(req.body.constructor != Array) {
        throw Error('Request must be Array')
    }
    for(var idx in req.body) {
        log.debug(">>> insertMultiAnnounce, idx=", idx, ", data=", req.body[idx]);
        checkValidArrayParam(req.body, idx, 'USER_ID');
        checkValidArrayParam(req.body, idx, 'SVC_TYPE');
        checkValidArrayParam(req.body, idx, 'ANI');
        checkValidArrayParam(req.body, idx, 'ANN_NUMBER');
        checkValidArrayParam(req.body, idx, 'UNIQ_ID');
        checkValidArrayParam(req.body, idx, 'SEQ_NO');
    }
    
    MultiAnnounce.insertMultiAnnounceList(req.body, function(err, result) {
        var response = {};

        if(err) {
            return next(err);
        }

        if(result > 0) {
            response = {"result":result, "resultString":"SUCCESS"};
        }
        else {
            response = {"result":result, "resultString":"FAIL"};
        }
        res.send(response);
    });
});

router.get('/getWorkTime', 
	passport.authenticate('bearer', { session: false }),
    function (req, res, next) { // GET 이므로, req.query
    log.debug(">>> getWorkTime : req.query : ", req.query);

    checkScope("read", req.user.scope);

    ApiCall.getWorkTime(req.query['START_DATE'], req.query['END_DATE'], function (err, result) {
        if (!err) {
            log.debug(">>> getWorkTime : result : ", result);
            res.json(result);
        } else {
            log.debug(">>> getWorkTime : err : ", err);
            res.json(err);
        }
    });
});

module.exports = router;
