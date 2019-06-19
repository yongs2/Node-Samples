#!/usr/bin/env node

const app = require('./app');
var log = require('log4js').getLogger("server");

var port = (process.env.PORT || '3000');

app.listen(port);
log.info("listening port : " + port);
log.info("ENV=", process.env.DB_URL, process.env.DB_USER, process.env.DB_PASS);