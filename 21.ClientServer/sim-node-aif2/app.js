'use strict';

const dateFormat = require('dateformat');
const path = require('path');
const log4js = require('log4js');
const agentdb = require('./model/agentdb')
const dbDefine = require('./model/agtDbDefine');
var config = require('./config');
const oauthApiCall = require('./service/oauthApiCall')(config.LOG.ENV);
const log = log4js.getLogger("app");
const iconv = require('iconv-lite');
const TextLineClient = require('./textline-socket/textline-client');

console.log('config/log4js-' + (config.LOG.ENV) + '.json');
log4js.configure(path.join(__dirname, 'config/log4js-' + (config.LOG.ENV) + '.json'));


var options_tcp = {
    port: config.AIF.PORT, 
    host: config.AIF.HOST
};
var options_ssl = {
    port: config.AIF.PORTS, 
    host: config.AIF.HOST,

    // Necessary only if using the client certificate authentication
    key: '',
    cert: '',

    // Necessary only if the server uses the self-signed certificate
    ca: '',
    strictSSL: true, // allow us to use our self-signed cert for testing
    rejectUnauthorized: true,  // Trust to listed certificates only. Don't trust even google's certificates.
    checkServerIdentity: (servername, cert) => { console.log("servername=", servername, ", cert=", cert); return null; },
};

let nIntervalMsKeepAlive = config.AIF.IV_KEEPALIVE;
let intervalKeepAlive = undefined;
let nIntervalMsAgentDb = config.AIF.IV_AGENTDB;
let intervalAgentDb = undefined;

let aifClient = undefined;
let CLIENT_ID = "TEST_AGENT_0001"
let szAccessToken = "TEST_ACCESS_00001"

function OnConnect() {
    writeBindReq(CLIENT_ID, szAccessToken);
}

function OnData(data) {
    let json = JSON.parse(data);
    if (json.head.MsgName == 'BIND_RSP') {
        log.info("<== BIND_RSP.Seq=", json.head.Seq, ", Body.Result=", json.body.nResult, json.body.sMaxTPS_SMS, json.body.sMaxTPS_LMS);
        if(intervalKeepAlive == undefined) {
            // 주기적으로 KEEP_ALIVE 메시지를 전송해야 함
            intervalKeepAlive = setInterval(TimerKeepAlive, nIntervalMsKeepAlive);
        }
        if(intervalAgentDb == undefined) {
            // 주기적으로 AgentDB에서 전송할 데이터가 있는 지 확인해야 함
            intervalAgentDb = setInterval(TimerAgentDb, nIntervalMsAgentDb);
        }
    }
    if (json.head.MsgName == "SUBMIT_RSP") {
        OnSubmitRsp(json);
    }
    if (json.head.MsgName == "REPORT_REQ") {
        OnReportReq(json);
    }
    if (json.head.MsgName == "READREPLY_REQ") {
        OnReadReplyReq(json);
    }
}

function AllClearInterval() {
    if(intervalKeepAlive != undefined) {
        clearInterval(intervalKeepAlive);
        intervalKeepAlive = undefined;
    }
    if(intervalAgentDb != undefined) {
        clearInterval(intervalAgentDb);
        intervalAgentDb = undefined;
    }
}

function OnEnd() {
    AllClearInterval();    
}

function OnClose(hadError) {
    AllClearInterval();
}

function TimerKeepAlive() {
    log.debug("TimerKeepAlive....");
    writeKeepAlive()
}

function TimerAgentDb() {
    agentdb.getMsgCnt(function(err, result) {
        if(!err) {
            //log.debug(">>> TimerAgentDb.getMsgCnt=", result);
            if(result > 0) {
                log.debug(">>> TimerAgentDb.getMsgCnt=", result);
                agentdb.getMsg(function(err, result) {
                    if(!err) {
                        log.debug(">>> TimerAgentDb.getMsg=", result.length);
                        for(var i=0; i<result.length; i++) {
                            writeSubmitReq(result[i]);
                        }
                    }
                    else {
                        log.error(">>> TimerAgentDb.getMsg : err: ", err)
                    }
                })
            }
        }
        else {
            log.error(">>> TimerAgentDb.getMsgCnt : err: ", err)
        }
    });
}

function writeKeepAlive() {
    let nDecRate_SMS = 0, nDecRate_LMS = 0;
    let KeepAlive = {
        "head":{
            "MsgName":"KEEP_ALIVE",
            "Seq": GetSequence(),
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "sDecRate_SMS":nDecRate_SMS, 
            "sDecRate_LMS":nDecRate_LMS
        }
    };

    log.debug("==> writeKeepAlive : ", nDecRate_SMS, nDecRate_LMS);
    aifClient.write(JSON.stringify(KeepAlive));
}

function writeBindReq(varLoginId, varToken) {
    let BindReq = {
        "head":{
            "MsgName":"BIND_REQ",
            "Seq": GetSequence(),
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "szLoginId":varLoginId, "szToken":varToken, "cRvSMS_F":0, "cRvMMS_F" : 0, "cEnc_F" : 0
        }
    }
    log.info("==> writeBindReq(", varLoginId, ", ", varToken, ")");
    aifClient.write(JSON.stringify(BindReq));
}

function writeSubmitReq(object) {
    if(typeof(object) != 'object') {
        log.info("==> writeSubmitReq, InvalidType : ", typeof(object));
        return;
    }
    let reqTime = dateFormat(new Date(), "yyyymmddhhMMss");
    let SubmitReq = {
        "head":{
            "MsgName":"SUBMIT_REQ",
            "Seq": GetSequence(),
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nMsgType" : object.MSG_TYPE,
            "szMsgKey" : iconv.encode(object.MSG_KEY, 'EUC-KR').toString("binary"),
            "szCaller" : iconv.encode(object.CALLER_NO, 'EUC-KR').toString("binary"),
            "szCallee" : iconv.encode(object.CALLEE_NO, 'EUC-KR').toString("binary"),
            "szCallBack" : iconv.encode(object.CALLBACK_NO, 'EUC-KR').toString("binary"),
            "Priority" : object.ORDER_FLAG,
            "CntUpDate" : reqTime,
            "ReadReply" : object.READ_REPLY_FLAG,
            "szSubject" : iconv.encode(object.SUBJECT, 'EUC-KR').toString("binary"),
            "szMessage" : iconv.encode(object.SMS_MSG, 'EUC-KR').toString("binary"),
            "szFileName" : ""
        }
    }
    let bufMessage = Buffer.alloc(SubmitReq.body.szMessage.length, SubmitReq.body.szMessage, "binary");
    let szMessage = iconv.decode(bufMessage, 'EUC-KR');
    log.info("==> writeSubmitReq.MsgType=", object.MSG_TYPE, ", MsgKey=", object.MSG_KEY, ", szMessage=", szMessage);
    aifClient.write(JSON.stringify(SubmitReq));
}

function OnSubmitRsp(json) {
    let submitRsp = json.body;
    let szResultMsg = "";

    log.info("<== SUBMIT_RSP.Seq=", json.head.Seq, ", Body.Result=", json.body.nResult, json.body.nMsgType, json.body.szMsgKey);

    if(json.body.nResult == 0) {
        szResultMsg = "Sucess";
    }
    else {
        szResultMsg = "Fail;"
    }
    var item = {
        PROC_STS: dbDefine.procSts.SUBMIT,
        MSG_TYPE: submitRsp.nMsgType,
        MSG_KEY: submitRsp.szMsgKey,
        QUERYSESSIONKEY: submitRsp.szQuerySessionKey,
        PROC_RESULT: submitRsp.nResult,
        RESULT_MSG: szResultMsg,
        ERROR_CODE: submitRsp.szErrCode,
        ERROR_DESCRIPTION: submitRsp.szErrText,
        SEND_COUNT: 1,
    }
    agentdb.updateTblSendSms(item, function(err, result) {
        if(!err) {
            log.debug("    OnSubmitRsp.updateTblSendSms=", result);
        }
        else {
            log.error("    OnSubmitRsp.updateTblSendSms : err: ", err)
        }
    })
}

function OnReportReq(json) {
    let reportReq = json.body;
    let szResultMsg = "";

    log.info("<== REPORT_REQ.Seq=", json.head.Seq, ", Body.Result=", json.body.nResult, json.body.nMsgType, json.body.szMsgKey);

    if(json.body.nResult == 0) {
        szResultMsg = "Sucess";
    }
    else {
        szResultMsg = "Fail;"
    }
    var item = {
        PROC_STS: dbDefine.procSts.RESULT,
        MSG_TYPE: reportReq.nMsgType,
        MSG_KEY: reportReq.szMsgKey,
        QUERYSESSIONKEY: reportReq.szQuerySessionKey,
        PROC_RESULT: reportReq.nResult,
        RESULT_MSG: szResultMsg,
        ERROR_CODE: reportReq.szErrCode,
        ERROR_DESCRIPTION: reportReq.szErrText,
        REPORT_ID: reportReq.szReportID,
        SEND_COUNT: 1,
    }
    agentdb.updateTblSendSms(item, function(err, result) {
        if(!err) {
            log.debug("    OnReportReq.updateTblSendSms=", result);
            writeReportRsp(json.head.Seq, 0, item);
        }
        else {
            log.error("    OnReportReq.updateTblSendSms : err: ", err)
            writeReportRsp(json.head.Seq, -1, item);
        }
    })
}

function writeReportRsp(varSeq, varResult, object) {
    if(typeof(object) != 'object') {
        log.info("==> writeReportRsp, InvalidType : ", typeof(object));
        return;
    }

    let ReportRsp = {
        "head":{
            "MsgName":"REPORT_RSP",
            "Seq": varSeq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "nMsgType" : object.MSG_TYPE,
            "szMsgKey" : object.MSG_KEY.toString(),
            "szQuerySessionKey" : object.QUERYSESSIONKEY.toString(),
            "szReportID" : object.REPORT_ID,
        }
    }
    log.info("==> writeReportRsp.MsgType=", object.MSG_TYPE, ", MsgKey=", object.MSG_KEY);
    aifClient.write(JSON.stringify(ReportRsp));
}

function OnReadReplyReq(json) {
    let readReplyReq = json.body;
    let szResultMsg = "";

    log.info("<== READREPLY_REQ.Seq=", json.head.Seq, ", Body.Result=", json.body.nResult, json.body.nMsgType, json.body.szMsgKey);
    
    if(json.body.nResult == 0) {
        szResultMsg = "Sucess";
    }
    else {
        szResultMsg = "Fail;"
    }
    var item = {
        PROC_STS: dbDefine.procSts.REPORT,
        MSG_TYPE: readReplyReq.nMsgType,
        MSG_KEY: readReplyReq.szMsgKey,
        QUERYSESSIONKEY: readReplyReq.szQuerySessionKey,
        PROC_RESULT: readReplyReq.nSendResult,
        RESULT_MSG: szResultMsg,
        ERROR_CODE: readReplyReq.szErrCode,
        ERROR_DESCRIPTION: readReplyReq.szErrText,
        REPORT_ID: readReplyReq.szReportID,
        SEND_COUNT: 1,
    }
    agentdb.updateTblSendSms(item, function(err, result) {
        if(!err) {
            log.debug("    OnReportReq.updateTblSendSms=", result);
            writeReadReplyRsp(json.head.Seq, 0, item);
        }
        else {
            log.error("    OnReportReq.updateTblSendSms : err: ", err)
            writeReadReplyRsp(json.head.Seq, -1, item);
        }
    })
}

function writeReadReplyRsp(varSeq, varResult, object) {
    if(typeof(object) != 'object') {
        log.info("==> writeReportRsp, InvalidType : ", typeof(object));
        return;
    }

    let ReadReplyRsp = {
        "head":{
            "MsgName":"READREPLY_RSP",
            "Seq": varSeq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "nMsgType" : object.MSG_TYPE,
            "szMsgKey" : object.MSG_KEY.toString(),
            "szQuerySessionKey" : object.QUERYSESSIONKEY.toString(),
            "szReportID" : object.REPORT_ID,
        }
    }
    log.info("==> writeReadReplyRsp.MsgType=", object.MSG_TYPE, ", MsgKey=", object.MSG_KEY);
    aifClient.write(JSON.stringify(ReadReplyRsp));
}

let g_ulSeq = 0;
function GetSequence() {
    if(g_ulSeq >= Number.MAX_SAFE_INTEGER) {
        g_ulSeq = 0;
    }
    else {
        g_ulSeq += 1;
    }
    return g_ulSeq;
}

// main
oauthApiCall.GetAccessToken(function(err, result) {
    if (!err) {
        log.info(">>> GetAccessToken : result : ", result);
        aifClient = new TextLineClient();
        if(config.AIF.SSL == false) {
            aifClient.connect(true, options_tcp);
        }
        else {
            aifClient.connect(false, options_ssl);
        }
        aifClient.setCbConnect = OnConnect;
        aifClient.setCbData = OnData;
        aifClient.setCbEnd = OnEnd;
        aifClient.setCbClose = OnClose;
    }
    else {
        log.error(">>> GetAccessToken : err : ", err);
    }
});
