'use strict';
var expect = require('chai').expect;
var log = require('log4js').getLogger("redisTest");
const oauthModel = require('../model/oauthModel');

describe('DB test', () => {
    it('SUCCESS to getClient', async function() {   // async/await �� ����ϴ� ��쿡�� ���ڿ��� done�� �����ؾ� �Ѵ�
        var clientId = "client";
        var clientSecret = "secret";
        
        try {
            var oauthClient = await oauthModel.getClient(clientId, clientSecret)
            
            console.log("redisTest-----> getClient.oauthClient : ", oauthClient);
            expect(oauthClient.clientId).to.equal(clientId);
            expect(oauthClient.clientSecret).to.equal(clientSecret);
            console.log("redisTest-----> getClient.oauthClient done........ ");
        }
        catch(err) {
            console.log("redisTest-----> getClient.oauthClient err:", err);
        }
    });
});