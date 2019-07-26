'use strict'

const fs = require('fs');
const dateFormat = require('dateformat');
const iconv = require('iconv-lite');
const TextLineServer = require('./textline-socket/textline-server');

function OnConnection(aifClient) {
    aifClient.on('data', function(data) { 
		OnData(aifClient, data);
    }); 
    aifClient.on('close', function(){ 
		console.log('Client disconnected'); 
	}); 
    aifClient.on('error', function(error){ 
		console.log('Client error : ', error); 
	});
}

function OnData(aifClient, data) {
    let json = undefined;
    try {
        json = JSON.parse(data);
    }
    catch(error) {
        console.log("Error:", error, ", data=[", data + "]");
    }
    
    if (json.head.MsgName == 'BIND_REQ') {
        OnBindReq(aifClient, json);
    }
    else if (json.head.MsgName == 'UNBIND_REQ') {
        OnUnbindReq(aifClient, json);
    }
    else if (json.head.MsgName == "SUBMIT_REQ") {
        OnSubmitReq(aifClient, json);
    }
    else if (json.head.MsgName == "REPORT_RSP") {
        OnReportRsp(aifClient, json);
    }
    else if (json.head.MsgName == "READREPLY_RSP") {
        OnReadReplyRsp(aifClient, json);
    }
    else if (json.head.MsgName == "KEEP_ALIVE") {
        OnKeepAlive(aifClient, json);
    }
    else {
        console.log("RECV UNDEFINED:", json.head.MsgName);
    }
}

function OnBindReq(aifClient, json) {
    console.log("<== BIND_REQ.Seq=", json.head.Seq, ", Body.szLoginId=", json.body.szLoginId, json.body.szToken);

    let req_seq = json.head.Seq;
    let varResult = 0;
    let varMaxTPS_SMS = 0;
    let varMaxTPS_LMS = 0;

    let BindRsp = {
        "head":{
            "MsgName":"BIND_RSP",
            "Seq": req_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "sMaxTPS_SMS" : varMaxTPS_SMS,
            "sMaxTPS_LMS" : varMaxTPS_LMS,
        }
    }
    console.log("==> writeBindRsp.Seq=", req_seq, ", szLoginId=", json.body.szLoginId);
    aifClient.write(JSON.stringify(BindRsp));
}

function OnUnbindReq(aifClient, json) {
    console.log("<== UNBIND_REQ.Seq=", json.head.Seq, ", Body.szLoginId=", json.body.szLoginId, json.body.varToken);

    let req_seq = json.head.Seq;
    let varResult = 0;

    let UnbindRsp = {
        "head":{
            "MsgName":"UNBIND_RSP",
            "Seq": req_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
        }
    }
    console.log("==> writeUnbindRsp.Seq=", req_seq, ", szLoginId=", json.body.szLoginId);
    aifClient.write(JSON.stringify(UnbindRsp));
}

function OnSubmitReq(aifClient, json) {
    console.log("<== SUBMIT_REQ.Seq=", json.head.Seq, ", Body.MsgType=", json.body.nMsgType, ", MsgKey=", json.body.szMsgKey);

    let bufSubject = Buffer.alloc(json.body.szSubject.length, json.body.szSubject, "binary");
    let szSubject = iconv.decode(bufSubject, "EUC-KR");
    let bufMessage = Buffer.alloc(json.body.szMessage.length, json.body.szMessage, "binary");
    let szMessage = iconv.decode(bufMessage, 'EUC-KR');

    console.log("    Msg[", json.body.nMsgType, ",", json.body.szMsgKey, "] "
        + "Caller=[", json.body.szCaller, "] "
        + "Callee=[", json.body.szCallee, "] "
        + "CallBack=[", json.body.szCallBack, "] "
        + "Subject[", szSubject, "] "
        + "Message[", szMessage, "] "
        + "FileName[", json.body.szFileName, "]");

    let req_seq = json.head.Seq;
    let varResult = 0;

    let nMsgType = json.body.nMsgType;
    let szMsgKey = json.body.szMsgKey;
    let szQuerySessionKey = "SYSTEM_CREATE_KEY_" + req_seq;
    let szErrCode = "0";
    let szErrText = "SUCCESS";

    let SubmitRsp = {
        "head":{
            "MsgName":"SUBMIT_RSP",
            "Seq": req_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "nMsgType" : nMsgType,
            "szMsgKey" : szMsgKey,
            "szQuerySessionKey" : szQuerySessionKey,
            "szErrCode" : szErrCode,
            "szErrText" : szErrText,
        }
    }
    console.log("==> writeSubmitRsp.Seq=", req_seq, ", Body.MsgType=", SubmitRsp.body.nMsgType, ", MsgKey=", SubmitRsp.body.szMsgKey);
    aifClient.write(JSON.stringify(SubmitRsp));

    setTimeout(function(aifClient, json) {
        writeReportReq(aifClient, json);
    }, 3500, aifClient, SubmitRsp);

    setTimeout(function(aifClient, json) {
        writeReadReplyReq(aifClient, json);
    }, 3500, aifClient, SubmitRsp);
}

function OnReportRsp(aifClient, json) {
    console.log("<== REPORT_RSP.Seq=", json.head.Seq, ", Body.MsgType=", json.body.nMsgType, ", MsgKey=", json.body.szMsgKey);
}

function writeReportReq(aifClient, json) {
    let rsp_seq = json.head.Seq;

    let varResult = 0;

    let nMsgType = json.body.nMsgType;
    let szMsgKey = json.body.szMsgKey;
    let szQuerySessionKey = "SYSTEM_CREATE_KEY_" + rsp_seq;
    let szErrCode = "0";
    let szErrText = "SUCCESS";
    let szReportID = "REPORT_ID_" + rsp_seq;

    let ReportReq = {
        "head":{
            "MsgName":"REPORT_REQ",
            "Seq": rsp_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "nMsgType" : nMsgType,
            "szMsgKey" : szMsgKey,
            "szQuerySessionKey" : szQuerySessionKey,
            "szErrCode" : szErrCode,
            "szErrText" : szErrText,
            "szReportID" : szReportID,
        }
    }
    console.log("==> writeReportReq.Seq=", ReportReq.head.seq, ", Body.MsgType=", ReportReq.body.nMsgType, ", MsgKey=", ReportReq.body.szMsgKey);
    aifClient.write(JSON.stringify(ReportReq));
}

function OnReadReplyRsp(aifClient, json) {
    console.log("<== READREPLY_RSP.Seq=", json.head.Seq, ", Body.MsgType=", json.body.nMsgType, ", MsgKey=", json.body.szMsgKey);
}

function writeReadReplyReq(aifClient, json) {
    let rsp_seq = json.head.Seq;

    let varResult = 0;

    let nMsgType = json.body.nMsgType;
    let szMsgKey = json.body.szMsgKey;
    let szQuerySessionKey = "SYSTEM_CREATE_KEY_" + rsp_seq;
    let szChkdDate = dateFormat(new Date(), "yyyymmddhhMMss");
    let nSendResult = 0;
    let szErrCode = "0";
    let szErrText = "SUCCESS";
    let szReportID = "REPORT_ID_" + rsp_seq;

    let ReadReplyReq = {
        "head":{
            "MsgName":"READREPLY_REQ",
            "Seq": rsp_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "nResult" : varResult,
            "nMsgType" : nMsgType,
            "szMsgKey" : szMsgKey,
            "szQuerySessionKey" : szQuerySessionKey,
            "szChkdDate" : szChkdDate,
            "nSendResult" : nSendResult, 
            "szErrCode" : szErrCode,
            "szErrText" : szErrText,
            "szReportID" : szReportID,
        }
    }
    console.log("==> writeReadReplyReq.Seq=", ReadReplyReq.head.seq, ", Body.MsgType=", ReadReplyReq.body.nMsgType, ", MsgKey=", ReadReplyReq.body.szMsgKey);
    aifClient.write(JSON.stringify(ReadReplyReq));
}

function OnKeepAlive(aifClient, json) {
    console.log("<== KEEP_ALIVE.Seq=", json.head.Seq, ", Body.sDecRate_SMS=", json.body.sDecRate_SMS, ", sDecRate_LMS=", json.body.sDecRate_LMS);
    let req_seq = json.head.Seq;

    let varResult = 0;
    let sDecRate_SMS = json.body.sDecRate_SMS;
    let sDecRate_LMS = json.body.sDecRate_LMS;

    let KeepAliveRsp = {
        "head":{
            "MsgName":"KEEP_ALIVE",
            "Seq": req_seq,
            "Ret": 0,
            "Version":"1.0.0"
        },
        "body":{
            "sDecRate_SMS" : sDecRate_SMS,
            "sDecRate_LMS" : sDecRate_LMS,
        }
    }
    console.log("==> writeKeepAliveRsp.Seq=", req_seq, ", Body.sDecRate_SMS=", KeepAliveRsp.body.sDecRate_SMS, ", sDecRate_LMS=", KeepAliveRsp.body.sDecRate_LMS);
    aifClient.write(JSON.stringify(KeepAliveRsp));
}

var options_tcp = {
    port : 4000,
};
var options_tls = {
    port : 4443,
    key: fs.readFileSync(__dirname + '/keys/server.key'),
    cert: fs.readFileSync(__dirname + '/keys/server.crt')
};

let aifServer = new TextLineServer();
aifServer.setOptionsTcp = options_tcp;   // TCP
aifServer.setOptionsTls = options_tls; // TLS

aifServer.setCbConnection = OnConnection;
aifServer.setCbData = OnData;
aifServer.Listen();
