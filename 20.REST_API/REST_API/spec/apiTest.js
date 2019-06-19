'use strict';

const chai = require('chai');
const chaiHttp = require('chai-http');
const app = require('../app');
var log = require('log4js').getLogger("apiTest");

var expect = chai.expect;

chai.should();
chai.use(chaiHttp);

describe('/GET /api/getMultiAnnounce', () => {
    it('SUCCESS to get MultiAnnounce', function(done) {
        this.timeout(15000);
        
        var objQuery = {
                START_DATE : '20190614000000',
                END_DATE : '20190630235959',
                USER_ID : 'test',
                ANI : '02-1234-1234',
                ANN_NAME : '테스트'
        };

        chai.request(app)
            .get('/api/getMultiAnnounce')
            .query(objQuery)
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                if((res.body.length > 0) && (res.body['result'] == undefined)) {
                    // 데이터가 json 일 것이다.
                    log.debug("httpTest-----> getMultiAnnounce : res.len : ", res.body.length);
                    res.body.should.be.a('array');
                    res.body.should.have.length.greaterThan(1);
                    res.body[0].should.be.a('object');
                    res.body[0].should.have.property('STD_TIME');
                    res.body[0].should.have.property('USER_ID');
                    res.body[0].USER_ID.should.equal(objQuery['USER_ID']);
                    res.body[0].should.have.property('ANI');
                    res.body[0].ANI.should.equal(objQuery['ANI']);
                    res.body[0].should.have.property('ANN_NAME');
                    res.body[0].ANN_NAME.should.equal(objQuery['ANN_NAME']);
                }
                else if(res.body.length == 0) {
                    res.body.should.be.a('array');  // expect []
                }
                else {
                    log.debug("httpTest-----> getMultiAnnounce : res : ", res.body["result"]);
                    res.body.should.have.property('result').eql(0);
                }
                done()
            })
    });
});

describe('/POST /api/insertMultiAnnounce', () => {
    it('SUCCESS to insert MultiAnnounce', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([
                {
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트69",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트79",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                },
                {
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트70",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트70",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110002",
                    SEQ_NO : "0"
                }
            ])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(0)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send({
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                })
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - USER_ID', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - SVC_TYPE', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "devTest001",
                    SVC_TYPE: "",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - ANI', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - ANN_NUMBER', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : "0"
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - UNIQ_ID', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "",
                    SEQ_NO : "0"
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });

    it('Fail to insert MultiAnnounce - SEQ_NO', function(done) {
        this.timeout(15000);
        
        chai.request(app)
            .post('/api/insertMultiAnnounce')
            .send([{
                    USER_ID: "devTest001",
                    SVC_TYPE: "0",
                    ANI : "0212341234",
                    ANN_NAME : "테스트",
                    ANN_NUMBER : "02-9999-1234",
                    ANN_ADDRS : "안내 주소 테스트",
                    ANI_OPER : "A",
                    ANI_NAME : "애니네임",
                    UNIQ_ID : "10110001",
                    SEQ_NO : ""
                }])
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                res.body.should.have.property('result').eql(-1)
                log.debug("httpTest-----> insertMultiAnnounce : res : ", res.body["result"]);
                done()
            })
    });
});

describe('/GET /api/getWorkTime', () => {
    it('SUCCESS to getWorkTime', function(done) {
        this.timeout(15000);
        
        var objQuery = {
                START_DATE : '20170601000000',
                END_DATE : '20170901000000'
        };

        chai.request(app)
            .get('/api/getWorkTime')
            .query(objQuery)
            .end((err, res) => {
                if (err) { console.error(err) }
                res.should.have.status(200);
                res.should.to.be.json;
                if((res.body.length > 0) && (res.body['result'] == undefined)) {
                    // 데이터가 json 일 것이다.
                    log.debug("httpTest-----> getMultiAnnounce : res.len : ", res.body.length);
                    res.body.should.be.a('array');
                    res.body.should.have.length.greaterThan(0);
                    res.body[0].should.be.a('object');
                    res.body[0].should.have.property('AGENT_ID');
                    res.body[0].should.have.property('AGENT_DN');
                    res.body[0].AGENT_DN.should.equal('1001');
                    res.body[0].should.have.property('AGENT_IP');
                    res.body[0].should.have.property('LOGIN_DATE');
                    res.body[0].should.have.property('ERR_RESULT');
                    res.body[0].ERR_RESULT.should.equal('1');
                }
                else if(res.body.length == 0) {
                    res.body.should.be.a('array');  // expect []
                }
                else {
                    log.debug("httpTest-----> getWorkTime : res : ", res.body["result"]);
                    res.body.should.have.property('result').eql(0);
                }
                done()
            })
    });
});
