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
const MemoryStore = require('./model/InMemoryModel');
const memoryStore = new MemoryStore()

app.oauth = new oauthServer({
  model: memoryStore,
});

// Post token.
app.post('/oauth/token', app.oauth.token());

// Get authorization.
app.get('/oauth/authorize', function(req, res) {
  // Redirect anonymous users to login page.
  if (!req.app.locals.user) {
    return res.redirect(util.format('/login?redirect=%s&client_id=%s&redirect_uri=%s', req.path, req.query.client_id, req.query.redirect_uri));
  }

  return render('authorize', {
    client_id: req.query.client_id,
    redirect_uri: req.query.redirect_uri
    });
});

// Post authorization.
app.post('/oauth/authorize', function(req, res) {
  // Redirect anonymous users to login page.
  if (!req.app.locals.user) {
    return res.redirect(util.format('/login?client_id=%s&redirect_uri=%s', req.query.client_id, req.query.redirect_uri));
  }

  return app.oauth.authorize();
});

// Get secret.
app.get('/v1/tokeninfo', function(req, res) {
  // https://github.com/passport/express-4.x-http-bearer-example/blob/master/server.js
  // Will require a valid access_token.
  //res.send('Secret area');
  console.log('tokeninfo.token=', req.query['access_token']);
  console.log('tokeninfo.getAccessToken=', req.query['access_token']);
  var tokens = memoryStore.getAccessToken(req.query['access_token'])
  if(tokens == false) {
    res.sendStatus(401);
  }
  else {
    res.status(200).json(tokens);
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
