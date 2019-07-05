'use strict';

var log = require('log4js').getLogger("oauthApiCall");
var express = require('express');
var router = express.Router();
const oauthApiCall = require('../service/oauthApiCall')('dev');
var passport = require('passport');
var formidable = require('formidable');
var config = require('../config');
var os = require('os');
var fs = require('fs');
const async = require('async');

router.post('/token', function(req, res, next) {
  var basicAuth = "";
  basicAuth += "Basic " + new Buffer(req.body.clientId + ":" + req.body.clientSecret).toString("base64");

  var body = "";
  body += "grant_type=" + req.body.grantType;
  body += "&" + "client_id=" + req.body.clientId;
  body += "&" + "client_secret=" + req.body.clientSecret;
  body += "&" + "username=" + req.body.userName;
  body += "&" + "password=" + req.body.password;
  body += "&" + "scope=" + "read,write";

  oauthApiCall.GetAccessToken(basicAuth, body, function (err, result) {
    if (!err) {
        log.debug(">>> GetAccessToken : result : ", result);
        res.send(result);
      } else {
        log.info(">>> GetAccessToken : err : ", err);
        res.send(err);
      }
  });
});

router.get('/testAuth', function(req, res, next) {
  passport.authenticate('token', { session: false }, function(err, user, info, status) {
    if (err) { return next(err) }
    if (!user) {
      log.debug(">>> Unauthoized: info=", info.name, ", ", info.message, ", status=", status);
      res.sendStatus(401);
    }
    else {
      res.send('TEST SUCC');
    }
  })(req, res, next);
});

var handleFileUpload = function(req, res, next, cb) {
  var form = new formidable.IncomingForm();

  form.uploadDir = os.tmpdir();
  form.keepExtensions = true;
  form.multiples = true;

  var loginId = "";
  var msgKey = "";
  var nFileIndex = 0;

  form.on('error', function(err) {
        log.info(">>> fileUpload.err:", err);
        cb(err);
      })
      .on('field', function(field, value) {
        log.debug('>>> fileUpload.field:', field, ", value=", value);
        if(field == "loginId") {
          loginId = value;
        }
        else if(field == "msgKey") {
          msgKey = value;
        }
      })
      .on('fileBegin', function(name, file) {
        //file.path = config.DIRECTORY.UPLOAD + "/" + msgKey + "_" + nFileIndex + "_" + file.name;
        log.debug(">>> fileUpload.file.path=", file.path);
        nFileIndex += 1;
      })
      .on('file', function(field, file) {
        // on file received
        log.debug(">>> fileUpload.file.field=", field, ", file.name=", file.name);
      })
      .on('progress', function(bytesReceived, bytesExpected) {
        log.trace('>>> fileUpload.progress.Recv=', bytesReceived, ", Exp=", bytesExpected);
        var percent = (bytesReceived / bytesExpected * 100) | 0;
        process.stdout.write("Uploading: %" + percent + "\r");
        /*if(percent > 50) {
          log.debug('>>> fileUpload.Unexception Error.Recv=', bytesReceived, ", Exp=", bytesExpected)
          cb(new Error("Unexception Error"));
        }*/
      })
      .on('end', function(req, res) {
        log.info(">>> fileUpload.form end ~~~, fileCnt=" + nFileIndex);
        process.stdout.write("Uploading: Done\n");

        nFileIndex = 0;
        var resultIdx = 0;
        async.eachSeries(this.openedFiles, (fileItem, next) => {
          log.info(">>> File=", fileItem.path, ", name=", fileItem.name, ", type=", fileItem.type);
          var new_path = config.DIRECTORY.UPLOAD + "/" + msgKey + "_" + nFileIndex + "_" + decodeURIComponent(fileItem.name);
          fs.rename(fileItem.path, new_path, function (err) { 
            if (err) { 
              log.info("rename.fail:", err);
            } 
            else {
              log.debug("rename.success!:", nFileIndex, ", new_path:", new_path);
              resultIdx += 1; // rename 성공 카운터
            }
            nFileIndex += 1;
            next(null, fileItem);   // rename 성공/실패 여부에 상관없이 reqBody의 다음 array 객체를 넘김
          });
        }, (error, results) => {
          if ( error ) {
            log.error('eachSeries.Error : ', error.message);
            return cb(err);;
          }
          log.info('async.eachSeries Done : ', results, ", nFileIndex=", nFileIndex, ", resultIdx=", resultIdx);

          cb(null, "Upload SUCCESS");
        });
      });

  form.parse(req, function(err, fields, files) {
    log.info(">>> fileUpload.parse : fields=", fields, ", files=", files.length);
  });
}

router.post('/fileUpload', function(req, res, next) {
  passport.authenticate('token', { session: false }, function(err, user, info, status) {
    if (err) { return next(err) }
    if (!user) {
      log.debug(">>> Unauthoized: info=", info.name, ", ", info.message, ", status=", status);
      res.sendStatus(401);
    }
    else {
      try {
        handleFileUpload(req, res, next, function(err, result) {
          if(err) {
            log.debug(">>> handleFileUpload.Unexception Error:", err);
            return next(err);
          }
          else {
            res.send(result);
            log.debug(">>> handleFileUpload, ret=", result);
          }
        });
      }
      catch(err) {
        next(err);
      }
    }
  })(req, res, next);
});

module.exports = router;
