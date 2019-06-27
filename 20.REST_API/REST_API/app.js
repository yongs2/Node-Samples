'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var morgan = require('morgan');
const log4js = require('log4js');
var passport = require('passport');
var Strategy = require('passport-http-bearer').Strategy;
const oauthApiCall = require('./service/oauthApiCall')('dev');

const dotenv = require('dotenv');
dotenv.config();

var log = log4js.getLogger("app");
console.log('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');
log4js.configure('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');

var apiRouter = require('./routes/api');

passport.use(new Strategy(
  function(token, cb) {
    oauthApiCall.validAccessToken(token, function (err, result) {
      if (!err) {
          log.debug(">>> validAccessToken : result : ", result);
          return cb(null, result);
      } else {
          log.info(">>> validAccessToken : err : ", err);
          return cb(err);
      }
  });
}));

var app = express();

// swagger
const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('api/swagger.yaml');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: false }));

app.use(function(req, res, next) {
  if (!req.headers.authorization) {
    return res.status(403).json({ error: 'No credentials sent!' });
  }
  else {

  }
  next();
});

app.use('/api', apiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  log.info("env=" + req.app.get('env'));

  res.setHeader('Content-Type', 'application/json');
  var response = {"result":-1, "resultString":"FAIL"};

  if(err.status == 401) {
    res.status(err.status || 500).end(JSON.stringify(response));
  }
  else {
    res.status(200).end(JSON.stringify(response));
  }

  if (app.get('env') === 'development') {
    console.error(err.stack);
  }
});

module.exports = app;
