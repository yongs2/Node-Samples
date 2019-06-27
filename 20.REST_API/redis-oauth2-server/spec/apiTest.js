'use strict';
const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
var log = require('log4js').getLogger("apiTest");

var expect = chai.expect;

chai.should();
chai.use(chaiHttp);

describe('request AccessTokenWithClientCredential', () => {
    it('SUCCESS to get AccessToken', function(done) {
        this.timeout(15000);

        chai.request(app)
            .post('/oauth/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(
                {
                    grant_type : 'client_credentials',
                    client_id: 'client',
                    client_secret: 'secret'
                }
            )
            .end((err, res) => {
                if (err) {
                    console.error(err);
                }
                else {
                    res.should.have.status(200);
                    res.should.to.be.json;
                    res.body.should.have.property('token_type').eql("Bearer")
                    res.body.should.have.property('access_token')
                    res.body.should.have.property('expires_in').greaterThan(900)
                }
                done();
            });
    });
    it('FAIL to get AccessToken', function(done) {
        this.timeout(15000);

        chai.request(app)
            .post('/oauth/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(
                {
                    grant_type : 'client_credentials',
                    client_id: 'invalid-client-id',
                    client_secret: 'invalid-client-secret'
                }
            )
            .end((err, res) => {
                if (err) { console.error(err) }

                res.should.have.status(400);
                done();
            });
    });
    it('FAIL to auth AccessToken', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .get('/v1/tokeninfo')
            .query('access_token', 'invalid_access_token')
            .send()
            .end((err, res) => {
                if (err) {
                    console.error(err);
                }
                else {
                    res.should.have.status(401);
                }
                done();
            });
    });
});