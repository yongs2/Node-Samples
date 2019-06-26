'use strict';

var expect = require('chai').expect;
var log = require('log4js').getLogger("redisTest");
const oauthModel = require('../model/oauthModel');

describe('DB test', () => {
    it('SUCCESS to getClient', function(done) {
        var clientId = "client";
        var clientSecret = "secret";
        
        oauthModel.getClient(clientId, clientSecret)
            .then(function(oauthClient) {
                console.log("redisTest-----> getClient(oauthClient : ", oauthClient);
                expect(oauthClient.clientId).to.equal("client");
                expect(oauthClient.clientSecret).to.equal("secret");
                done();
            })
            .catch(done);
    });
});