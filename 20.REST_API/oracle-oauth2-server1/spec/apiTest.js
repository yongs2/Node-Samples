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
        chai.request(app)
            .post('/oauth/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(
                {
                    grant_type : 'client_credentials',
                    client_id: 'C180913050046',
                    client_secret: '$2a$10$DwWzROjwAaLlVN9KXq0rZO1u75MtMMd1h.vLQ6L.qi9B3ddbPeBUO'
                }
            )
            .end((err, res) => {
                if (err) { console.error(err) }

                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('token_type').eql("Bearer")
                res.body.should.have.property('access_token')
                res.body.should.have.property('expires_in').greaterThan(3000)
                done();
            });
    });
    /*
    it('FAIL to get AccessToken', function(done) {
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
    */
});