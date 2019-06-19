'use strict';

var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
var morgan = require('morgan');
const log4js = require('log4js');

var log = log4js.getLogger("app");
console.log('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');
log4js.configure('config/log4js-' + (process.env.NODE_ENV || 'development') + '.json');

var apiRouter = require('./routes/api');

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
  res.status(200).end(JSON.stringify(response));

  if (app.get('env') === 'development') {
    console.error(err.stack);
  }
});

module.exports = app;
