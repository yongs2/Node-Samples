'use strict';
var fs = require('fs');

var LOG = {
    "ENV" : (process.env.NODE_ENV || 'development'),
};

var REDIS= {
    "URL" : process.env.REDIS_URL || "redis://@127.0.0.1:6379/0",
    "AUTH_NAME" : process.env.REDIS_AUTH_NAME || "CLI#",
};

var JWT = {
    "ISS" : process.env.JWT_ISS || "nodeMsgHttpd",    // JWT 발급자
    "SECRET" : process.env.JWT_SECRET || "JAPIJWTKEY",
}

var DIRECTORY = {
    "UPLOAD" : process.env.DIRECTORY_UPLOAD || __dirname + "/../public",
}

var privateKey = fs.readFileSync(__dirname + '/private.pem').toString();
var certificate = fs.readFileSync(__dirname + '/mycommoncrt.crt').toString();

const httpsOptions = {
    key: privateKey,
    cert: certificate
};

module.exports = {
    LOG,
    REDIS,
    JWT,
    DIRECTORY,
    httpsOptions,
}
