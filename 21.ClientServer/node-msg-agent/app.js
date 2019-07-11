'strict'

var net_client = require('net');
var agtMsgHeader = require('./agtMsgHeader');
var agtMsg = require('./agtMsg');
const SocketPacketAssembler = require('socket-packet-assembler');
const agentdb = require('./model/agentdb')
var dateFormat = require('dateformat');

var host = '127.0.0.1'; // '192.168.0.192';
var port = 4000;
 
function getConnection() {
    //서버에 해당 포트로 접속 
    var client = ""; 
    var recvData = [];  
    var local_port = ""; 
    const nIntervalMsKeepAlive = 15*1000;
    var intervalKeepAlive = undefined;
    var nIntervalMsAgentDb = 1*1000;    // 매 1초마다
    var intervalAgentDb = undefined;
 
    client = net_client.connect({port: port, host: host}, function() {
     
        console.log("connect log======================================================================"); 
        console.log('connect success'); 
        console.log('local = ' + this.localAddress + ':' + this.localPort); 
        console.log('remote = ' + this.remoteAddress + ':' +this.remotePort); 
     
        const assembler = new SocketPacketAssembler(client);

        local_port = this.localPort; 
     
        this.setTimeout(600000); // timeout : 10분 
        console.log("client setting Encoding:binary, timeout:600000" ); 
        console.log("client connect localport : " + local_port);

        var isBigEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x12;
        var isLittleEndian = new Uint8Array(new Uint32Array([0x12345678]).buffer)[0] === 0x78;
        console.log(">>> BigEndian=", isBigEndian, ", LittleEndian=", isLittleEndian);
        writeBindReq(client, "testAgent-3", "accessToken11111");

        assembler.on('RecvHeader', buffer => {
            var msgHeader = new agtMsgHeader(buffer);
            console.log("recvHeader=", msgHeader.cFrame0, msgHeader.cFrame1, msgHeader.usLength, msgHeader.ucMsgType, msgHeader.ucMsgName, msgHeader.ucVersion, msgHeader.ucReserved, msgHeader.ulSeq);
            
            if(msgHeader.getDataLength() > 0) {
                assembler.readBytes(msgHeader.getDataLength(), msgHeader.strMsgName());
            }
            else {  // 데이터가 없다면, 다음 메시지를 읽기 위해 등록
                assembler.readBytes(12, 'RecvHeader');
            }
        });

        assembler.on('UNDEFINED', buffer => {
            console.log("Recv.UNDEFINED");

            if(intervalKeepAlive != undefined) {
                clearInterval(intervalKeepAlive);
                console.log("STOP KEEP_ALIVE");
            }

            // 다음 메시지를 읽기 위해 등록
            assembler.readBytes(12, 'RecvHeader');
        });

        assembler.on('KEEPALIVE', buffer => {
            var keepAlive = new agtMsg.KeepAlive(buffer);
            console.log("keepAlive=", keepAlive.sDecRate_SMS, keepAlive.sDecRate_LMS);

            // 다음 메시지를 읽기 위해 등록
            assembler.readBytes(12, 'RecvHeader');
        });

        assembler.on('BIND_RSP', buffer => {
            var bindRsp = new agtMsg.BindRsp(buffer);
            console.log("msgBindRsp=", bindRsp.nResult, bindRsp.sMaxTPS_SMS, bindRsp.sMaxTPS_LMS);

            // 주기적으로 KEEP_ALIVE 메시지를 전송해야 함
            intervalKeepAlive = setInterval(TimerKeepAlive, nIntervalMsKeepAlive, client);

            // 주기적으로 AgentDB에서 전송할 데이터가 있는 지 확인해야 함
            intervalAgentDb = setInterval(TimerAgentDb, nIntervalMsAgentDb, client);

            // BIND_RSP 응답을 받았으므로, SUBMIT_REQ를 전송한다.
            writeSubmitReq(client);

            // 다음 메시지를 읽기 위해 등록
            assembler.readBytes(12, 'RecvHeader');
        });

        assembler.on('SUBMIT_RSP', buffer => {
            var submitRsp = new agtMsg.SubmitRsp(buffer);
            console.log("msgSubmitRsp=", submitRsp);

            // 다음 메시지를 읽기 위해 등록
            assembler.readBytes(12, 'RecvHeader');
        });

        // 최초 읽을 것은 HeaderSize 만큼
        assembler.readBytes(12, 'RecvHeader');
    }); 
 
    // 접속 종료 시 처리 
    client.on('close', function() { 
        console.log("client Socket Closed : " + " localport : " + local_port); 
    });
 
    client.on('end', function() { 
        console.log('client Socket End'); 
    });
     
    client.on('error', function(err) { 
        console.log('client Socket Error: '+ JSON.stringify(err)); 
    });
     
    client.on('timeout', function() { 
        console.log('client Socket timeout: '); 
    });
     
    client.on('drain', function() { 
        console.log('client Socket drain: '); 
    });
     
    client.on('lookup', function() { 
        console.log('client Socket lookup: '); 
    });
    return client;
}

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
    console.log(print);
}

function writeBindReq(socket, varLoginId, varToken) {
    var BindReq = new agtMsg.BindReq();
    var msgBody = BindReq.make(varLoginId, varToken);
    var msgHeader = new agtMsgHeader();

    console.log("=======> writeBindReq");
    var data = concatTypedArrays(msgHeader.make(msgBody.length, BindReq.getMsgType(), BindReq.getMsgName(), 9999), msgBody);
    //logDataStream(data);
    writeData(socket, data);
}

function writeSubmitReq(socket) {
    var SubmitReq = new agtMsg.SubmitReq();

    var varMsgType = 0; // 0:SMS
    var varMsgKey = "MSG00001";
    var varCaller = "01011110001";
    var varCallee = "02022220001";
    var varCallBack = "03033330001";
    var varPriority = 0;
    var varCntUpDate = "20190709010101";
    var varReadReply = 0;
    var varSubject = "SMS Test 0001";
    var varMessage = ".......send SMS Body.............";
    var varFileName = "";
    
    var msgBody = SubmitReq.make(varMsgType, varMsgKey, varCaller, varCallee, varCallBack, varPriority, varCntUpDate, varReadReply, varSubject, varMessage, varFileName);
    var msgHeader = new agtMsgHeader();

    console.log("=======> writeSubmitReq");
    var data = concatTypedArrays(msgHeader.make(msgBody.length, SubmitReq.getMsgType(), SubmitReq.getMsgName(), 9999), msgBody);
    //logDataStream(data);

    var recvHeader = new agtMsgHeader(new Buffer.from(data.buffer, 0, agtMsgHeader.HeaderSize));
    console.log("writeSubmitReq.recvHeader=", recvHeader);
    var recvMsg = new agtMsg.SubmitReq(new Buffer.from(data.buffer, recvHeader.getHeaderSize(), recvHeader.getDataLength()));
    console.log("writeSubmitReq.recvMsg=", recvMsg);

    writeData(socket, data);
}

function writeSubmitReq(socket, object) {
    if(typeof(object) != 'object') {
        console.log("=======> writeSubmitReq, InvalidType : ", typeof(object));
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
    var msgHeader = new agtMsgHeader();

    console.log("=======> writeSubmitReq");
    var data = concatTypedArrays(msgHeader.make(msgBody.length, SubmitReq.getMsgType(), SubmitReq.getMsgName(), 9999), msgBody);
    //logDataStream(data);

    var recvHeader = new agtMsgHeader(new Buffer.from(data.buffer, 0, agtMsgHeader.HeaderSize));
    console.log("writeSubmitReq.recvHeader=", recvHeader);
    var recvMsg = new agtMsg.SubmitReq(new Buffer.from(data.buffer, recvHeader.getHeaderSize(), recvHeader.getDataLength()));
    console.log("writeSubmitReq.recvMsg=", recvMsg);

    writeData(socket, data);
}

function writeKeepAlive(socket) {
    var keepAlive = new agtMsg.KeepAlive();
    var nDecRate_SMS = 0, nDecRate_LMS = 0;

    var msgBody = keepAlive.make(nDecRate_SMS, nDecRate_LMS);
    var msgHeader = new agtMsgHeader();
    var data = concatTypedArrays(msgHeader.make(msgBody.length, keepAlive.getMsgType(), keepAlive.getMsgName(), 9999), msgBody);
    console.log("=======> writeKeepAlive : ", nDecRate_SMS, nDecRate_LMS);
    writeData(socket, data);
}

function writeData(socket, data){
    var success = socket.write(data);
    if(!success) {
        console.log("Server Send Fail : ", data.length);
    }
}

function TimerKeepAlive(socket) {
    console.log("TimerKeepAlive....");
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
            console.log(">>> TimerAgentDb.getMsgCnt=", result);
            agentdb.getMsg(function(err, result) {
                if(!err) {
                    console.log(">>> TimerAgentDb.getMsg=", result);
                    for(var i=0; i<result.length; i++) {
                        writeSubmitReq(socket, result[i]);
                    }
                }
                else {
                    console.log(">>> TimerAgentDb.getMsg : err: ", err)
                }
            })
        }
        else {
            console.log(">>> TimerAgentDb.getMsgCnt : err: ", err)
        }
    });
}

var client = getConnection();
