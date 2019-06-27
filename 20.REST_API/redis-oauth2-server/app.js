'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var morgan = require('morgan');
const log4js = require('log4js');
var oauthServer = require('express-oauth-server');

var log = log4js.getLogger("app");
console.log('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');
log4js.configure('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');

var indexRouter = require('./routes/index');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: false }));

// Add OAuth server.
const oauthModel = require('./model/oauthModel');
app.oauth = new oauthServer({
  model: oauthModel,
});

// Post token.
app.post('/oauth/token', app.oauth.token());
// Get secret.
app.get('/v1/tokeninfo', async function(req, res) {
  // https://github.com/passport/express-4.x-http-bearer-example/blob/master/server.js
  // Will require a valid access_token.
  //res.send('Secret area');
  log.info('tokeninfo.token=', req.query['access_token']);
  log.info('tokeninfo.getAccessToken=', req.query['access_token']);
  try {
    var tokens = await oauthModel.getAccessToken(req.query['access_token'])
    if(tokens == undefined) {
      log.info('tokeninfo.getAccessToken, fail 500');
      res.sendStatus(500);
    }
    else if(tokens == false) {
      log.info('tokeninfo.getAccessToken, false 401');
      res.sendStatus(401);
    }
    else if(tokens.length == 0) {
      log.info('tokeninfo.getAccessToken, fail 501');
      res.sendStatus(501);
    }
    else {
      log.info('tokeninfo.getAccessToken, 200 OK, tokens:', tokens);
      res.status(200).json(tokens);
    }
  }
  catch(err) {
    res.status(err.code || 500).json(err);
  }
});

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');

  if (app.get('env') === 'development') {
    console.error(err.stack);
  }
});

module.exports = app;
