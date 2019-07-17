'use strict';

var chai = require('chai')
  , expect = chai.expect
  , should = chai.should();
const app = require('../app');
const agtMsgHeader = require('../agtMsgHeader');
const agtMsg = require('../agtMsg');

describe('/agtMsg make and parse', () => {
    it('BIND_REQ', function(done) {
        var varLoginId = 'test1234';
        var varToken = 'token1234';

        var sendBindReq = new agtMsg.BindReq();
        var msgBody = sendBindReq.make(varLoginId, varToken);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvBindReq = new agtMsg.BindReq(buffer);
        
        recvBindReq.szLoginId.should.equal(varLoginId);
        recvBindReq.szToken.should.equal(varToken);
        done();
    });

    it('BIND_RSP', function(done) {
        var varResult = 0;
        var varMaxTPS_SMS = 10;
        var varMaxTPS_LMS = 5;

        var sendBindRsp = new agtMsg.BindRsp();
        var msgBody = sendBindRsp.make(varResult, varMaxTPS_SMS, varMaxTPS_LMS);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvBindRsp = new agtMsg.BindRsp(buffer);
        
        recvBindRsp.nResult.should.equal(varResult);
        recvBindRsp.sMaxTPS_SMS.should.equal(varMaxTPS_SMS);
        recvBindRsp.sMaxTPS_LMS.should.equal(varMaxTPS_LMS);
        done();
    });

    it('UNBIND_REQ', function(done) {
        var varLoginId = 'test1234';

        var sendUnbindReq = new agtMsg.UnbindReq();
        var msgBody = sendUnbindReq.make(varLoginId);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvUnbindReq = new agtMsg.UnbindReq(buffer);
        
        recvUnbindReq.szLoginId.should.equal(varLoginId);
        done();
    });

    it('UNBIND_RSP', function(done) {
        var varResult = 1;

        var sendUnbindRsp = new agtMsg.UnbindRsp();
        var msgBody = sendUnbindRsp.make(varResult);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvUnbindRsp = new agtMsg.UnbindRsp(buffer);
        
        recvUnbindRsp.nResult.should.equal(varResult);
        done();
    });

    it('SUBMIT_REQ', function(done) {
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varCaller = "CALLER0001";
        var varCallee = "CALLEE0001";
        var varCallBack = "CALLBACK0001";
        var varPriority = 1;
        var varCntUpDate = "20190101070707";
        var varReadReply = 0;
        var varSubject = "SUBJECT00001";
        var varMessage = "MESSAGE_000001";
        var varFileName = "FILENAME_000001";

        var sendSubmitReq = new agtMsg.SubmitReq();
        var msgBody = sendSubmitReq.make(varMsgType, varMsgKey, varCaller, varCallee, varCallBack, varPriority, varCntUpDate, varReadReply, varSubject, varMessage, varFileName);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvSubmitReq = new agtMsg.SubmitReq(buffer);
        
        recvSubmitReq.nMsgType.should.equal(varMsgType);
        recvSubmitReq.szMsgKey.should.equal(varMsgKey);
        recvSubmitReq.szCaller.should.equal(varCaller);
        recvSubmitReq.szCallee.should.equal(varCallee);
        recvSubmitReq.szCallBack.should.equal(varCallBack);
        recvSubmitReq.nPriority.should.equal(varPriority);
        recvSubmitReq.szCntUpDate.should.equal(varCntUpDate);
        recvSubmitReq.nReadReply.should.equal(varReadReply);
        recvSubmitReq.szSubject.should.equal(varSubject);
        recvSubmitReq.szMessage.should.equal(varMessage);
        recvSubmitReq.szFileName.should.equal(varFileName);
        done();
    });

    it('SUBMIT_RSP', function(done) {
        var varResult = 1;
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varQuerySessionKey = "QSK000001";
        var varErrCode = "ERR0001";
        var varErrText = "ERROR DESCRIPTION 0001";

        var sendSubmitRsp = new agtMsg.SubmitRsp();
        var msgBody = sendSubmitRsp.make(varResult, varMsgType, varMsgKey, varQuerySessionKey, varErrCode, varErrText);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvSubmitRsp = new agtMsg.SubmitRsp(buffer);
        
        recvSubmitRsp.nResult.should.equal(varResult);
        recvSubmitRsp.nMsgType.should.equal(varMsgType);
        recvSubmitRsp.szMsgKey.should.equal(varMsgKey);
        recvSubmitRsp.szQuerySessionKey.should.equal(varQuerySessionKey);
        recvSubmitRsp.szErrCode.should.equal(varErrCode);
        recvSubmitRsp.szErrText.should.equal(varErrText);
        done();
    });

    it('REPORT_REQ', function(done) {
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varQuerySessionKey = "QSK000001";
        var varCaller = "CALLER0001";
        var varCallee = "CALLEE0001";
        var varSendDate = "20190101070707";
        var varSendResult = 0;
        var varErrCode = "ERR0001";
        var varErrText = "ERROR DESCRIPTION 0001";
        var varReportID = "REPORT_ID_0001";

        var sendReportReq = new agtMsg.ReportReq();
        var msgBody = sendReportReq.make(varMsgType, varMsgKey, varQuerySessionKey, varCaller, varCallee, varSendDate, varSendResult, varErrCode, varErrText, varReportID);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvReportReq = new agtMsg.ReportReq(buffer);
        
        recvReportReq.nMsgType.should.equal(varMsgType);
        recvReportReq.szMsgKey.should.equal(varMsgKey);
        recvReportReq.szQuerySessionKey.should.equal(varQuerySessionKey);
        recvReportReq.szCaller.should.equal(varCaller);
        recvReportReq.szCallee.should.equal(varCallee);
        recvReportReq.szSendDate.should.equal(varSendDate);
        recvReportReq.nSendResult.should.equal(varSendResult);
        recvReportReq.szErrCode.should.equal(varErrCode);
        recvReportReq.szErrText.should.equal(varErrText);
        recvReportReq.szReportID.should.equal(varReportID);
        done();
    });

    it('REPORT_RSP', function(done) {
        var varResult = 1;
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varQuerySessionKey = "QSK000001";
        var varReportID = "REPORT_ID_0001";

        var sendReportRsp = new agtMsg.ReportRsp();
        var msgBody = sendReportRsp.make(varResult, varMsgType, varMsgKey, varQuerySessionKey, varReportID);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvReportRsp = new agtMsg.ReportRsp(buffer);
        
        recvReportRsp.nResult.should.equal(varResult);
        recvReportRsp.nMsgType.should.equal(varMsgType);
        recvReportRsp.szMsgKey.should.equal(varMsgKey);
        recvReportRsp.szQuerySessionKey.should.equal(varQuerySessionKey);
        recvReportRsp.szReportID.should.equal(varReportID);
        done();
    });

    it('READREPLY_REQ', function(done) {
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varQuerySessionKey = "QSK000001";
        var varCaller = "CALLER0001";
        var varCallee = "CALLEE0001";
        var varChkdDate = "20190101070707";
        var varSendResult = 0;
        var varErrCode = "ERR0001";
        var varErrText = "ERROR DESCRIPTION 0001";
        var varReportID = "REPORT_ID_0001";

        var sendReadReplyReq = new agtMsg.ReadReplyReq();
        var msgBody = sendReadReplyReq.make(varMsgType, varMsgKey, varQuerySessionKey, varCaller, varCallee, varChkdDate, varSendResult, varErrCode, varErrText, varReportID);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvReadReplyReq = new agtMsg.ReadReplyReq(buffer);
        
        recvReadReplyReq.nMsgType.should.equal(varMsgType);
        recvReadReplyReq.szMsgKey.should.equal(varMsgKey);
        recvReadReplyReq.szQuerySessionKey.should.equal(varQuerySessionKey);
        recvReadReplyReq.szCaller.should.equal(varCaller);
        recvReadReplyReq.szCallee.should.equal(varCallee);
        recvReadReplyReq.szChkdDate.should.equal(varChkdDate);
        recvReadReplyReq.nSendResult.should.equal(varSendResult);
        recvReadReplyReq.szErrCode.should.equal(varErrCode);
        recvReadReplyReq.szErrText.should.equal(varErrText);
        recvReadReplyReq.szReportID.should.equal(varReportID);
        done();
    });

    it('READREPLY_RSP', function(done) {
        var varResult = 1;
        var varMsgType = 0;
        var varMsgKey = "MSGKEY00001";
        var varQuerySessionKey = "QSK000001";
        var varReportID = "REPORT_ID_0001";

        var sendReadReplyRsp = new agtMsg.ReadReplyRsp();
        var msgBody = sendReadReplyRsp.make(varResult, varMsgType, varMsgKey, varQuerySessionKey, varReportID);

        var buffer = new Buffer.from(msgBody);  // Uint8Array 를 buffer로 변환해야 함
        var recvReadReplyRsp = new agtMsg.ReadReplyRsp(buffer);
        
        recvReadReplyRsp.nResult.should.equal(varResult);
        recvReadReplyRsp.nMsgType.should.equal(varMsgType);
        recvReadReplyRsp.szMsgKey.should.equal(varMsgKey);
        recvReadReplyRsp.szQuerySessionKey.should.equal(varQuerySessionKey);
        recvReadReplyRsp.szReportID.should.equal(varReportID);
        done();
    });

});
