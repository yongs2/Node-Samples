'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var morgan = require('morgan');
const log4js = require('log4js');
var oauthServer = require('express-oauth-server');
var passport = require('passport');
var config = require('./config');

require('./model/passport');

var log = log4js.getLogger("app");
console.log('config/log4js-' + (config.LOG.ENV) + '.json');
log4js.configure(path.join(__dirname, 'config/log4js-' + (config.LOG.ENV) + '.json'));

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

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
app.use(passport.initialize());

app.use('/', indexRouter);
app.use('/users', usersRouter);

// Add OAuth server.
const oauthModel = require('./model/oauthModel');
app.oauth = new oauthServer({
  model: oauthModel,
});

// Post token.
app.post('/oauth/token', app.oauth.token());
app.post('/token', app.oauth.token());	// token 발급

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
