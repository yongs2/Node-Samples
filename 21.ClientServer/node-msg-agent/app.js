'strict'

const net = require('net');
const tls = require('tls');
const fs = require('fs');
const dateFormat = require('dateformat');
const path = require('path');
const log4js = require('log4js');
const agtMsgHeader = require('./agtMsgHeader');
const agtMsg = require('./agtMsg');
const SocketPacketAssembler = require('socket-packet-assembler');
const agentdb = require('./model/agentdb')
const dbDefine = require('./model/agtDbDefine');
var config = require('./config');
const oauthApiCall = require('./service/oauthApiCall')(config.LOG.ENV);
const log = log4js.getLogger("app");

console.log('config/log4js-' + (config.LOG.ENV) + '.json');
log4js.configure(path.join(__dirname, 'config/log4js-' + (config.LOG.ENV) + '.json'));

var nIntervalMsKeepAlive = config.AIF.IV_KEEPALIVE;
var intervalKeepAlive = undefined;
var nIntervalMsAgentDb = config.AIF.IV_AGENTDB;
var intervalAgentDb = undefined;
var assembler = undefined;
var client = undefined;
var szAccessToken = undefined;

//서버에 해당 포트로 접속 
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

var connection = undefined;
var timeoutBindReq = undefined;

function getConnection(access_token) {
    szAccessToken = access_token;

    connectToServer();

    return client;
}

function connectToServer() {
    log.info("=== connectToServer");

    if(client != undefined) {
        client.removeAllListeners() // the important line that enables you to reopen a connection
        client.destroy();
    }

    if(config.AIF.SSL == false) {
        client = new net.Socket();
        connection = client.connect(options_tcp, connectListener());
    }
    else {
        client = new tls.TLSSocket();
        if(config.AIF.KEY != undefined && config.AIF.KEY.length > 0) {
            if(fs.existsSync(config.AIF.KEY)) {
                options_ssl.key = fs.readFileSync(config.AIF.KEY)
            }
            else {
                log.error("=== AIF_KEY.file not found:", config.AIF.KEY);
            }
        }
        if(config.AIF.CERT != undefined && config.AIF.CERT.length > 0) {
            if(fs.existsSync(config.AIF.CERT)) {
                options_ssl.cert = fs.readFileSync(config.AIF.CERT)
            }
            else {
                log.error("=== AIF_CERT.file not found:", config.AIF.CERT);
            }
        }
        if(config.AIF.CA != undefined && config.AIF.CA.length > 0) {
            if(fs.existsSync(config.AIF.CA)) {
                options_ssl.ca = fs.readFileSync(config.AIF.CA)
            }
            else {
                log.error("=== AIF_CA.file not found:", config.AIF.CA);
            }
        }
        connection = client.connect(options_ssl, connectListener());
    }
    client.setNoDelay(true);
    timeoutBindReq = undefined;
    return connection;
}

function connectListener() {
    log.info("=== connectListener SSL:", config.AIF.SSL);
    if (client.authorized) {
        log.info('Connection authorized by a Certificate Authority.');
    }
    else {
        log.info('Connection not authorized: ' + client.authorizationError);
    }
    client.addListener('connect', OnConnect)
    client.addListener('close', OnClose)
    client.addListener('secureConnect', OnSecureConnect)
    client.addListener('end', OnEnd);
    client.addListener('error', OnError);
    client.addListener('timeout', OnTimeout);
    client.addListener('drain', OnDrain);
    client.addListener('lookup', OnLookup);
    client.addListener('OCSPResponse', OnOCSPResponse);
}

function OnOCSPResponse(buffer) {
    log.debug("== OCSPResponse === ", buffer);
}

function OnSecureConnect() {
    log.debug("== OnSecureConnect === ");
}

function OnConnect() {
    log.info('=== connect success : local = ' + this.localAddress + ':' + this.localPort + ', remote = ' + this.remoteAddress + ':' +this.remotePort); 
 
    log.info("=== SSL : ", client.getProtocol(), ", ", client.getPeerCertificate(true), ", ", client.getCipher(), ", ", client.authorized, ", ", client.getFinished())
    log.info("=== SSL : ", client.getTLSTicket())
    if(assembler == undefined) {
        client.removeAllListeners('data');
        assembler = new SocketPacketAssembler(client);
    }

    /*
    var isBigEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12;
    var isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;
    log.debug(">>> BigEndian=", isBigEndian, ", LittleEndian=", isLittleEndian);
    */

    assembler.on('RecvHeader', buffer => {
        var msgHeader = new agtMsgHeader.Header(buffer);
        log.info("recvHeader=", msgHeader.cFrame0, msgHeader.cFrame1, msgHeader.usLength, msgHeader.ucMsgType, msgHeader.ucMsgName, msgHeader.ucVersion, msgHeader.ucReserved, msgHeader.ulSeq);
        
        if(msgHeader.getDataLength() > 0) {
            assembler.readBytes(msgHeader.getDataLength(), msgHeader.strMsgName());
        }
        else {  // 데이터가 없다면, 다음 메시지를 읽기 위해 등록
            readBytesHeader(assembler);
        }
    });

    assembler.on('UNDEFINED', buffer => {
        log.info("<== Recv.UNDEFINED : ", buffer.length);

        readBytesHeader(assembler);
    });

    assembler.on('KEEPALIVE', buffer => {
        var keepAlive = new agtMsg.KeepAlive(buffer);
        log.debug("<== keepAlive=", keepAlive.sDecRate_SMS, keepAlive.sDecRate_LMS);

        readBytesHeader(assembler);
    });

    assembler.on('BIND_RSP', buffer => {
        var bindRsp = new agtMsg.BindRsp(buffer);
        log.info("<== msgBindRsp=", bindRsp.nResult, bindRsp.sMaxTPS_SMS, bindRsp.sMaxTPS_LMS);

        /*if(intervalKeepAlive == undefined) {
            // 주기적으로 KEEP_ALIVE 메시지를 전송해야 함
            intervalKeepAlive = setInterval(TimerKeepAlive, nIntervalMsKeepAlive, client);
        }
        
        if(intervalAgentDb == undefined) {
            // 주기적으로 AgentDB에서 전송할 데이터가 있는 지 확인해야 함
            intervalAgentDb = setInterval(TimerAgentDb, nIntervalMsAgentDb, client);
        }*/

        readBytesHeader(assembler);
    });

    assembler.on('SUBMIT_RSP', buffer => {
        var submitRsp = new agtMsg.SubmitRsp(buffer);
        log.info("<== msgSubmitRsp.result=", submitRsp.nResult, ", MsgKey=", submitRsp.szMsgKey);

        var szResultMsg = "Undefined";
        if(submitRsp.nResult == 0) {
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
                log.debug("    msgSubmitRsp.updateTblSendSms=", result);
            }
            else {
                log.error("    msgSubmitRsp.updateTblSendSms : err: ", err)
            }
        })

        readBytesHeader(assembler);
    });

    assembler.on('REPORT_REQ', buffer => {
        var reportReq = new agtMsg.ReportReq(buffer);
        log.info("<== msgReportReq.MsgKey=", reportReq.szMsgKey, ", SendDate=", reportReq.szSendDate);

        var szResultMsg = "Undefined";
        if(reportReq.nSendResult == 0) {
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
            PROC_RESULT: reportReq.nSendResult,
            RESULT_MSG: szResultMsg,
            ERROR_CODE: reportReq.szErrCode,
            ERROR_DESCRIPTION: reportReq.szErrText,
            REPORT_ID: reportReq.szReportID,
            SEND_COUNT: 1,
        }
        agentdb.updateTblSendSms(item, function(err, result) {
            if(!err) {
                log.debug("    msgReportReq.updateTblSendSms=", result);
                writeReportRsp(client, 0, item);
            }
            else {
                log.error("    msgReportReq.updateTblSendSms : err: ", err)
                writeReportRsp(client, -1, item);
            }
        });

        readBytesHeader(assembler);
    })

    assembler.on('READREPLY_REQ', buffer => {
        var readReplyReq = new agtMsg.ReadReplyReq(buffer);
        log.info("<== msgReadReplyReq.MsgKey=", readReplyReq.szMsgKey, ", szChkdDate=", readReplyReq.szChkdDate);

        var szResultMsg = "Undefined";
        if(readReplyReq.nSendResult == 0) {
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
                log.debug("    msgReadReplyReq.updateTblSendSms=", result);
                writeReadReplyRsp(client, 0, item);
            }
            else {
                log.error("    msgReadReplyReq.updateTblSendSms : err: ", err)
                writeReadReplyRsp(client, -1, item);
            }
        });
        readBytesHeader(assembler);
    })

    readBytesHeader(assembler);

    timeoutBindReq = setTimeout(function() {
        writeBindReq(client, config.CLIENT.ID, szAccessToken);
    }, 200)
    log.debug("==== Register timeout:200 ms : ");
};

// 접속 종료 시 처리 
function OnClose() { 
    client.removeListener('close', function() {
        log.debug("removeListener(close)")
    })

    log.info("client Socket Closed : " + " localport : " + this.localPort); 
    if(intervalKeepAlive != undefined) {
        clearInterval(intervalKeepAlive);
        log.info("STOP Interval KEEP_ALIVE");
        intervalKeepAlive = undefined;
    }
    if(intervalAgentDb != undefined) {
        clearInterval(intervalAgentDb);
        log.info("STOP Interval AGENT_DB");
        intervalAgentDb = undefined;
    }
    if(assembler != undefined) {
        delete assembler;
        assembler = undefined;
    }

    setTimeout(function() {
        bReconnect = true;
        connectToServer();
    }, 10000)
};

function OnEnd() { 
    client.removeListener('end', function() {
        log.debug("removeListener(end)")
    })
    if(timeoutBindReq != undefined) {
        clearTimeout(timeoutBindReq);
    }
    client.end();
    log.info('client Socket End');
    timeoutBindReq = undefined;
};

function OnError(err) { 
    log.error('client Socket Error: '+ JSON.stringify(err));
    client.destroy();
};

function OnTimeout() { 
    log.error('client Socket timeout: '); 
};

function OnDrain() { 
    log.info('client Socket drain: '); 
};

function OnLookup() { 
    log.info('client Socket lookup: '); 
};

function logDataStream(data){  
    // log the binary data stream in rows of 8 bits
    var print = "";
    for (var i = 0; i < data.length; i++) {
        print += " " + data[i].toString(16);

        // apply proper format for bits with value < 16, observed as int tuples
        if (data[i] < 16) { print += "0"; }

        // insert a line break after every 8th bit
        if ((i + 1) % 8 === 0) {
            print += ' ';
        };

        if ((i + 1) % 16 === 0) {
            print += '\n';
        };
    }

    // log the stream
    log.debug(print);
}

function readBytesHeader(assembler) {
    // 다음 메시지를 읽기 위해 등록
    assembler.readBytes(agtMsgHeader.HeaderSize, 'RecvHeader');
}

function writeBindReq(socket, varLoginId, varToken) {
    timeoutBindReq = undefined;
    var BindReq = new agtMsg.BindReq();
    var msgBody = BindReq.make(varLoginId, varToken);
    var msgHeader = new agtMsgHeader.Header();

    log.info("==> writeBindReq(", varLoginId, ", ", varToken, ")");
    var data = concatTypedArrays(msgHeader.make(msgBody.length, BindReq.getMsgType(), BindReq.getMsgName(), GetSequence()), msgBody);
    //logDataStream(data);
    writeData(socket, data);
}

function writeSubmitReq(socket, object) {
    if(typeof(object) != 'object') {
        log.info("==> writeSubmitReq, InvalidType : ", typeof(object));
        return;
    }
    var reqTime = dateFormat(new Date(), "yyyymmddhhMMss");

    var SubmitReq = new agtMsg.SubmitReq();

    var varMsgType = object.MSG_TYPE;
    var varMsgKey = object.MSG_KEY;
    var varCaller = object.CALLER_NO;
    var varCallee = object.CALLEE_NO;
    var varCallBack = object.CALLBACK_NO;
    var varPriority = object.ORDER_FLAG;
    var varCntUpDate = reqTime;
    var varReadReply = object.READ_REPLY_FLAG;
    var varSubject = object.SUBJECT;
    var varMessage = object.SMS_MSG;
    var varFileName = "";
    
    var msgBody = SubmitReq.make(varMsgType, varMsgKey, varCaller, varCallee, varCallBack, varPriority, varCntUpDate, varReadReply, varSubject, varMessage, varFileName);
    var msgHeader = new agtMsgHeader.Header();

    log.info("==> writeSubmitReq.MsgType=", varMsgType, ", MsgKey=", varMsgKey);
    var data = concatTypedArrays(msgHeader.make(msgBody.length, SubmitReq.getMsgType(), SubmitReq.getMsgName(), GetSequence()), msgBody);
    //logDataStream(data);

    /*
    var recvHeader = new agtMsgHeader.Header(new Buffer.from(data.buffer, 0, agtMsgHeader.HeaderSize));
    log.info("writeSubmitReq.recvHeader=", recvHeader);
    var recvMsg = new agtMsg.SubmitReq(new Buffer.from(data.buffer, recvHeader.getHeaderSize(), recvHeader.getDataLength()));
    log.info("writeSubmitReq.recvMsg=", recvMsg);
    */

    writeData(socket, data);
}

function writeReportRsp(socket, varResult, object) {
    if(typeof(object) != 'object') {
        log.info("==> writeReportRsp, InvalidType : ", typeof(object));
        return;
    }

    var ReportRsp = new agtMsg.ReportRsp();

    var varMsgType = object.MSG_TYPE;
    var varMsgKey = object.MSG_KEY;
    var varQuerySessionKey = object.QUERYSESSIONKEY;
    var varReportID = object.REPORT_ID;
    
    var msgBody = ReportRsp.make(varResult, varMsgType, varMsgKey, varQuerySessionKey, varReportID);
    var msgHeader = new agtMsgHeader.Header();

    log.info("==> writeReportRsp.MsgType=", varMsgType, ", MsgKey=", varMsgKey);
    var data = concatTypedArrays(msgHeader.make(msgBody.length, ReportRsp.getMsgType(), ReportRsp.getMsgName(), GetSequence()), msgBody);
    //logDataStream(data);

    writeData(socket, data);
}

function writeReadReplyRsp(socket, varResult, object) {
    if(typeof(object) != 'object') {
        log.info("==> writeReadReplyRsp, InvalidType : ", typeof(object));
        return;
    }

    var ReadReplyRsp = new agtMsg.ReadReplyRsp();

    var varMsgType = object.MSG_TYPE;
    var varMsgKey = object.MSG_KEY;
    var varQuerySessionKey = object.QUERYSESSIONKEY;
    var varReportID = object.REPORT_ID;
    
    var msgBody = ReadReplyRsp.make(varResult, varMsgType, varMsgKey, varQuerySessionKey, varReportID);
    var msgHeader = new agtMsgHeader.Header();

    log.info("==> writeReadReplyRsp.MsgType=", varMsgType, ", MsgKey=", varMsgKey);
    var data = concatTypedArrays(msgHeader.make(msgBody.length, ReadReplyRsp.getMsgType(), ReadReplyRsp.getMsgName(), GetSequence()), msgBody);
    //logDataStream(data);

    writeData(socket, data);
}

function writeKeepAlive(socket) {
    var keepAlive = new agtMsg.KeepAlive();
    var nDecRate_SMS = 0, nDecRate_LMS = 0;

    var msgBody = keepAlive.make(nDecRate_SMS, nDecRate_LMS);
    var msgHeader = new agtMsgHeader.Header();
    var data = concatTypedArrays(msgHeader.make(msgBody.length, keepAlive.getMsgType(), keepAlive.getMsgName(), GetSequence()), msgBody);
    log.debug("==> writeKeepAlive : ", nDecRate_SMS, nDecRate_LMS);
    writeData(socket, data);
}

function writeData(socket, data){
    var success = socket.write(data);
    if(!success) {
        log.error("Server Send Fail : ", data.length);
    }
}

function TimerKeepAlive(socket) {
    log.debug("TimerKeepAlive....");
    writeKeepAlive(socket)
}

function concatTypedArrays(a, b) { // a, b TypedArray of same type
    var c = new (a.constructor)(a.length + b.length);
    c.set(a, 0);
    c.set(b, a.length);
    return c;
}

function TimerAgentDb(socket) {
    agentdb.getMsgCnt(function(err, result) {
        if(!err) {
            log.debug(">>> TimerAgentDb.getMsgCnt=", result);
            if(result > 0) {
                agentdb.getMsg(function(err, result) {
                    if(!err) {
                        log.debug(">>> TimerAgentDb.getMsg=", result.length);
                        for(var i=0; i<result.length; i++) {
                            writeSubmitReq(socket, result[i]);
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

var g_ulSeq = 0;
function GetSequence() {
    if(g_ulSeq >= Number.MAX_SAFE_INTEGER) {
        g_ulSeq = 0;
    }
    else {
        g_ulSeq += 1;
    }
    return g_ulSeq;
}

oauthApiCall.GetAccessToken(function(err, result) {
    if (!err) {
        log.info(">>> GetAccessToken : result : ", result);
        var client = getConnection(result.access_token);
    } 
    else {
        log.error(">>> GetAccessToken : err : ", err);
    }
}); 
