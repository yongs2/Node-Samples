'use strict';

var expect = require('chai').expect;
var log = require('log4js').getLogger("dbTest");
const MultiAnnounce = require('../model/MultiAnnounce.js');

describe('DB test', () => {
    it('SUCCESS to insert - insertMultiAnnounce', function(done) {
        this.timeout(15000);

        var objQuery = [
            {
                USER_ID: "devTest001",
                SVC_TYPE: "0",
                ANI : "0212341234",
                ANN_NAME : "테스트69",
                ANN_NUMBER : "02-9999-1234",
                ANN_ADDRS : "안내 주소 테스트69",
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
                SEQ_NO : "1"
            }
        ];

        MultiAnnounce.insertMultiAnnounceList(objQuery, function(err, result) {
            console.info("dbTest-----> insertMultiAnnounceList : result : ", result);
            if (result != undefined) {
                console.info("dbTest-----> insertMultiAnnounceList : result.length ", result.length);
            }
            done();
        });
    });

    it('SUCCESS to select - getMultiAnnounceList', function(done) {
        this.timeout(15000);

        var objQuery = { 
            START_DATE: '20190614000000',
            END_DATE: '20190630235959',
            USER_ID: 'devTest001',
            ANI: '02-9999-1234',
            ANN_NAME: '테스트'
        };

        MultiAnnounce.getMultiAnnounceList(objQuery, function(err, result) {
            log.info("dbTest-----> getMultiAnnounceList : result : ", result);
            if (result != undefined) {
                log.info("dbTest-----> getMultiAnnounceList : result.length ", result.length);
                expect(result[0]['STD_TIME']).to.equal('2019-06-14 17:57:14');
                expect(result[0]['USER_ID'].to.equal(objQuery['USER_ID']));
                expect(result[0]['USER_NAME'].to.equal('대전교육8'));
                expect(result[0]['ANI'].to.equal(objQuery['ANI']));
                expect(result[0]['ANN_NAME'].to.equal(objQuery['ANN_NAME']));
            }
            done();
        });
    });
});
