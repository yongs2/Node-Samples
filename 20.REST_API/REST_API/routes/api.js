'use strict';

var express = require('express');
var router = express.Router();
var log = require('log4js').getLogger("api");
const MultiAnnounce = require('../model/MultiAnnounce');
const ApiCall = require('../service/ApiCall')('dev');

/* GET home page. */
router.get('/', function(req, res, next) {
    res.sendStatus(501); // Not implemented
});

function checkValidObjectParam(obj, paramName) {
    if (obj[paramName] == undefined || obj[paramName].length <= 0) throw Error("Req." + paramName + ' is NULL')
}

function checkValidArrayParam(arr, idx, paramName) {
    if (arr[idx][paramName] == undefined || arr[idx][paramName].length <= 0) throw Error("Req." + idx + '.' + paramName + ' is NULL')
}

router.get("/getMultiAnnounce", function (req, res, next) { // GET 이므로, req.query
    log.debug(">>> getMultiAnnounce : req.query : ", req.query, ",body=", req.body);
    
    checkValidObjectParam(req.query, 'START_DATE');
    checkValidObjectParam(req.query, 'END_DATE');

    MultiAnnounce.getMultiAnnounceList(req.query, function(err, result) {
        if(err) {
            return next(err);
        }
        res.send(result);
    });
});

router.post('/insertMultiAnnounce', function (req, res, next) {  // POST 이므로, req.body
    log.debug(">>> insertMultiAnnounce : req.body : ", typeof(req.body), ", Con=", req.body.constructor, ", Len=", req.body.length);
    
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

router.get('/getWorkTime', function (req, res, next) { // GET 이므로, req.query
    log.debug(">>> getWorkTime : req.query : ", req.query);

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
