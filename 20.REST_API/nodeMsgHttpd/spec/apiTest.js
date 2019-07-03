'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
var log = require('log4js').getLogger("apiTest");

var expect = chai.expect;

chai.should();
chai.use(chaiHttp);

describe('/GET /token', () => {
    it('SUCCESS to get accessToken', function(done) {
        this.timeout(15000);
        
        var objBody = {
            grantType : 'password',
            userName : 'testAgent-1',
            password : 'test_auth',
            clientId : 'testAgent-1',
            clientSecret : 'test_auth'
        };

        chai.request(app.listen())
            .post('/token')
            .set("Content-Type", "application/json")
            .send(objBody)
            .end((err, res) => {
                if (err) { console.error(err) }
                //console.log("res.body=", res.body);
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('errno');
                res.body.errno.should.equal("ECONNREFUSED");    // mocha test 에서는 token -> auth/token 으로 호출하는 것이 차단된다.
                done()
            })
    });
});

describe('/Request AccessTokenWithPassword', () => {
    it('SUCCESS to get AccessToken', function(done) {
        this.timeout(15000);

        chai.request(app)
            .post('/oauth/token')
            .set('content-type', 'application/x-www-form-urlencoded')
            .send(
                {
                    grant_type : 'password',
                    username : 'testAgent-1',
                    password : 'test_auth',
                    client_id : 'testAgent-1',
                    client_secret : 'test_auth',
                    scope : "read,write"
                }
            )
            .end((err, res) => {
                if (err) {
                    console.error(err);
                }
                else {
                    res.should.have.status(200);
                    res.should.to.be.json;
                    //console.log("res.body=", res.body);
                    res.body.should.have.property('token_type').eql("Bearer")
                    res.body.should.have.property('access_token')
                    res.body.should.have.property('expires_in').greaterThan(900)
                }
                done();
            });
    });
});

describe('/Request testAuth', () => {
    var accessToken1 = "";

    it('getAccessToken', getAccessToken());

    it('SUCCESS to testAuth', function(done) {
        this.timeout(15000);

        chai.request(app)
            .get('/testAuth')
            .set('Authorization', 'token ' + accessToken1)
            .send()
            .end((err, res) => {
                if (err) {
                    console.error(err);
                }
                else {
                    res.should.have.status(200);
                    //console.log("res.text=", res.text, ", res.body=", res.body);
                }
                done();
            });
    });

    it('SUCCESS to fileUpload', function(done) {
        this.timeout(15000);
        var parms = {
            loginId : "testAgent-1",
            msgKey : "msgKey000001"
        }
        chai.request(app)
            .post('/fileUpload')
            .set('Authorization', 'token ' + accessToken1)
            .field('loginId', 'testAgent-1')
            .field('msgKey', 'msgKey000001')
            .attach('file', 'C:/temp/test_file.txt')
            .end((err, res) => {
                if (err) {
                    console.error(err);
                }
                else {
                    res.should.have.status(200);
                    //console.log("res.text=", res.text, ", res.body=", res.body);
                }
                done();
            });
    });

    function getAccessToken() {
        return function(done) {
            var reqBody = {
                grant_type : 'password',
                username : 'testAgent-1',
                password : 'test_auth',
                client_id : 'testAgent-1',
                client_secret : 'test_auth',
                scope : "read,write"
            }
    
            chai.request(app)
                .post('/oauth/token')
                .set('content-type', 'application/x-www-form-urlencoded')
                .send(reqBody)
                .end((err, res) => {
                    if (err) {
                        console.error(err);
                    }
                    else {
                        res.should.have.status(200);
                        res.should.to.be.json;
                        //console.log("res.body=", res.body);
                        res.body.should.have.property('token_type').eql("Bearer")
                        res.body.should.have.property('access_token')
                        res.body.should.have.property('expires_in').greaterThan(900)
                        accessToken1 = res.body['access_token'];
                    }
                    done();
                });
        }
    }
});

