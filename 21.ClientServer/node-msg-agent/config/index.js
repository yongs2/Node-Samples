'use strict';
var fs = require('fs');

var LOG = {
    "ENV" : (process.env.NODE_ENV || 'development'),
};

var OAUTH = {
    "URL" : process.env.OAUTH_URL || 'http://192.168.0.210:3000',
};

var AIF = {
    "SSL" : process.env.AIF_SSL || true,
    "KEY" : process.env.AIF_KEY || '',
    "CERT" : process.env.AIF_CERT || '',
    "CA" : process.env.AIF_CA || '',
    "HOST" : process.env.AIF_IP || '192.168.0.210',
    "PORT" : process.env.AIF_PORT || 4000,
    "PORTS": process.env.AIF_PORTS || 4443,
    "IV_KEEPALIVE" : process.env.AIF_IV_KEEPALIVE || 15000,
    "IV_AGENTDB" :process.env.AIF_IV_AGENTDB || 1000,
};

var AGENT_DB = {
    "HOST": process.env.AGENT_DB_HOST || '192.168.0.210', 
    "PORT": process.env.AGENT_DB_HOST || 3307,
    "USER": process.env.AGENT_DB_USER || 'agent', 
    "PASSWORD" : process.env.AGENT_DB_PASSWORD || 'agent.123', 
    "DB_NAME" : process.env.AGENT_DB_NAME || 'AGENT_DB', 
}

var USER = {
    "NAME" : process.env.USER_NAME || 'testAgent-1',
    "PASSWORD" : process.env.USER_PASSWORD || 'test_auth',
}
var CLIENT = {
    "ID" : process.env.CLIENT_ID || 'testAgent-1',
    "SECRET" : process.env.CLIENT_SECRET || 'test_auth',
}
module.exports = {
    LOG,
    OAUTH,
    AIF,
    AGENT_DB,
    USER,
    CLIENT,
}
