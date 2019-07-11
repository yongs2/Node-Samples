'strict'

var iconv = require('iconv-lite');

/*
LABELS = [
         ('szLogInID',      '32s')
        ,('szToken',        '256s')
        ,('cRvSMS_F',       'c')
        ,('cRvMMS_F',       'c')
        ,('cEnc_F',         'c')
        ,('cFiller',        'c')
    ]   # 32+256+1+1+1+1 = 292 bytes
*/
function BindReq(buffer) {
    this.msgType = 1;   // REQ
    this.msgName = 1;   // BIND
    this.msgSize = 32+256+1+1+1+1;  // 292

    this.buffer = buffer;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
};

BindReq.prototype = {
    getMsgType : function() {   return this.msgType; },
    getMsgName : function() {   return this.msgName; },
    init : function() {
        this.szLogInID = "";
        this.szToken = "";
        this.cRvSMS_F = 0;
        this.cRvMMS_F = 0;
        this.cEnc_F = 0;
        this.cFiller = 0;
    },
    getResult : function() {
        return this.nResult;
    },
    make : function(varLoginId, varToken) {
        var msgBody = new ArrayBuffer(this.msgSize);

        var byteOffset  = 0, byteLength = 0;
        
        var szLogInID = new DataView(msgBody, byteOffset, byteLength = 32); 
        for(var i=0; i<varLoginId.length; i++) {
            szLogInID.setUint8(i, varLoginId.charCodeAt(i));
        }
        byteOffset += byteLength;
    
        var szToken = new DataView(msgBody, byteOffset, byteLength = 256);
        for(var i=0; i<varToken.length; i++) {
            szToken.setUint8(i, varToken.charCodeAt(i));
        }
        byteOffset += byteLength;
    
        var cRvSMS_F = new DataView(msgBody, byteOffset, byteLength = 1); cRvSMS_F.setUint8(0, 1); byteOffset += byteLength;
        var cRvMMS_F = new DataView(msgBody, byteOffset, byteLength = 1); cRvMMS_F.setUint8(0, 1); byteOffset += byteLength;
        var cEnc_F = new DataView(msgBody, byteOffset, byteLength = 1); cEnc_F.setUint8(0, 1); byteOffset += byteLength;
        var cFiller = new DataView(msgBody, byteOffset, byteLength = 1); cFiller.setUint8(0, 1); byteOffset += byteLength;
    
        console.log("...msgBody=", msgBody);
        var arrayBody = new Uint8Array(msgBody);
        return arrayBody;
    },
    parse : function(stMsgBody) {
        var byteOffset  = 0, byteLength = 0; 

        this.szLogInID = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=32;
        this.szToken = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=256;
        this.cRvSMS_F = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=1;
        this.cRvMMS_F = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=1;
        this.cEnc_F = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=1;
        this.cFiller = stMsgBody.readUInt8(byteOffset += byteLength); byteLength=1;
        return;
    }
}

/*
	int		nResult;
	short	sMaxTPS_SMS;				// SMS에 대한 허용 TPS
    short	sMaxTPS_LMS;				// LMS/MMS에 대한 허용 TPS
*/
function BindRsp(buffer) {
    this.msgType = 2;   // RSP
    this.msgName = 1;   // BIND
    this.msgSize = 4+2+2;

    this.buffer = buffer;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
};

BindRsp.prototype = {
    getMsgType : function() {   return this.msgType; },
    getMsgName : function() {   return this.msgName; },
    init : function() {
        this.nResult = 0;
        this.sMaxTPS_SMS = 0;
        this.sMaxTPS_LMS = 0;
    },
    getResult : function() {
        return this.nResult;
    },
    make : function(nMaxTPS_SMS, nMaxTPS_LMS) {
        var msgBody = new ArrayBuffer(this.MsgSize);

        var byteOffset  = 0, byteLength = 0;
        
        var sMaxTPS_SMS = new DataView(msgBody, byteOffset, byteLength = 2); sMaxTPS_SMS.setUint16(0, nMaxTPS_SMS); byteOffset += byteLength;
        var sMaxTPS_LMS = new DataView(msgBody, byteOffset, byteLength = 2); sMaxTPS_LMS.setUint16(0, nMaxTPS_LMS); byteOffset += byteLength;

        console.log("...msgBody=", msgBody);
        var arrayBody = new Uint8Array(msgBody);
        return arrayBody;
    },
    parse : function(stMsgBody) {
        var byteOffset  = 0, byteLength = 0; 

        this.nResult = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;
        this.sMaxTPS_SMS = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        this.sMaxTPS_LMS = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        return;
    }
}

/*
	int		nMsgType;				// __enAgtMsg, SMS:0, LMS:1, MMS:2	
	char	szMsgKey[16];
	char	szCaller[16];
	char	szCallee[16];
	char	szCallBack[16];
	int		nPriority;				// 우선순위, 0:낮음(default), 1:높음
	char	szCntUpDate[16];		// Contents Upload 일시
	int		nReadReply;				// ReadyReply 여부

	short	sV_Subject;				// 제목
	short	sV_Message;				// 문자 내용
	short	sV_FileName;			// 사전에 HTTP로 Upload한 Contents 파일명
	short	sV_Filler;

    char	cP[ALIGN];
*/
function SubmitReq(buffer) {
    this.msgType = 1;   // REQ
    this.msgName = 3;   // SUBMIT
    this.msgSize = 4+16+16+16+16+4+16+4+2+2+2+2; // 그외

    this.buffer = buffer;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
}

SubmitReq.prototype = {
    getMsgType : function() {   return this.msgType; },
    getMsgName : function() {   return this.msgName; },
    init : function() {
        this.nMsgType = 0;      // __enAgtMsg, SMS:0, LMS:1, MMS:2	
        this.szMsgKey = "";
        this.szCaller = "";
        this.szCallee = "";
        this.szCallBack = "";
        this.nPriority = 0;     // 우선순위, 0:낮음(default), 1:높음
        this.szCntUpDate;       // Contents Upload 일시
        this.nReadReply = 0;        // ReadyReply 여부
    
        this.sV_Subject;        // 제목
        this.sV_Message;        // 문자 내용
        this.sV_FileName;       // 사전에 HTTP로 Upload한 Contents 파일명
        this.sV_Filler;         // short

        this.szSubject = "";
        this.szMessage = "";
        this.szFileName = "";
    },
    make : function(varMsgType, varMsgKey, varCaller, varCallee, varCallBack, varPriority, varCntUpDate, varReadReply, varSubject, varMessage, varFileName) {
        // DB에서 읽은 데이터는 UTF-8 이므로, 이를 euc-kr로 변환를 해야, length 계산이 정확
        var varMsgKey = iconv.encode(varMsgKey, 'EUC-KR').toString("binary");
        var varCaller = iconv.encode(varCaller, 'EUC-KR').toString("binary");
        var varCallee = iconv.encode(varCallee, 'EUC-KR').toString("binary");
        var varCallBack = iconv.encode(varCallBack, 'EUC-KR').toString("binary");
        var varCntUpDate = iconv.encode(varCntUpDate, 'EUC-KR').toString("binary");
        var varSubject = iconv.encode(varSubject, 'EUC-KR').toString("binary");
        var varMessage = iconv.encode(varMessage, 'EUC-KR').toString("binary");
        var varFileName = iconv.encode(varFileName, 'EUC-KR').toString("binary");
        
        var msgLength = this.msgSize + varSubject.length + varMessage.length + varFileName.length
        var msgBody = new ArrayBuffer(msgLength);

        var byteOffset  = 0, byteLength = 0;
        
        var nMsgType = new DataView(msgBody, byteOffset, byteLength = 4); nMsgType.setUint32(0, varMsgType); byteOffset += byteLength;

        var szMsgKey = new DataView(msgBody, byteOffset, byteLength = 16); 
        for(var i=0; i<varMsgKey.length; i++) {
            szMsgKey.setUint8(i, varMsgKey.charCodeAt(i));
        }
        byteOffset += byteLength;
    
        var szCaller = new DataView(msgBody, byteOffset, byteLength = 16);
        for(var i=0; i<varCaller.length; i++) {
            szCaller.setUint8(i, varCaller.charCodeAt(i));
        }
        byteOffset += byteLength;

        var szCallee = new DataView(msgBody, byteOffset, byteLength = 16);
        for(var i=0; i<varCallee.length; i++) {
            szCallee.setUint8(i, varCallee.charCodeAt(i));
        }
        byteOffset += byteLength;

        var szCallBack = new DataView(msgBody, byteOffset, byteLength = 16);
        for(var i=0; i<varCallBack.length; i++) {
            szCallBack.setUint8(i, varCallBack.charCodeAt(i));
        }
        byteOffset += byteLength;

        var nPriority = new DataView(msgBody, byteOffset, byteLength = 4); nPriority.setUint32(0, varPriority); byteOffset += byteLength;
    
        var szCntUpDate = new DataView(msgBody, byteOffset, byteLength = 16);
        for(var i=0; i<varCntUpDate.length; i++) {
            szCntUpDate.setUint8(i, varCntUpDate.charCodeAt(i));
        }
        byteOffset += byteLength;

        var nReadReply = new DataView(msgBody, byteOffset, byteLength = 4); nReadReply.setUint32(0, varReadReply); byteOffset += byteLength;

        var cP_Offset = 0;
        var sV_Subject = new DataView(msgBody, byteOffset, byteLength = 2); sV_Subject.setUint16(0, cP_Offset); byteOffset += byteLength;
        var sV_Message = new DataView(msgBody, byteOffset, byteLength = 2); sV_Message.setUint16(0, cP_Offset += varSubject.length); byteOffset += byteLength;
        var sV_FileName = new DataView(msgBody, byteOffset, byteLength = 2); sV_FileName.setUint16(0, cP_Offset += varMessage.length); byteOffset += byteLength;
        var sV_Filler = new DataView(msgBody, byteOffset, byteLength = 2); sV_Filler.setUint16(0, cP_Offset += varFileName.length); byteOffset += byteLength;
    
        // cP.sV_Subject
        var cP_Subject = new DataView(msgBody, byteOffset, byteLength = varSubject.length);
        for(var i=0; i<varSubject.length; i++) {
            cP_Subject.setUint8(i, varSubject.charCodeAt(i));
        }
        if(varSubject.length > 0)
            byteOffset += byteLength;

        // cP.sV_Message
        var cP_Message = new DataView(msgBody, byteOffset, byteLength = varMessage.length);
        for(var i=0; i<varMessage.length; i++) {
            cP_Message.setUint8(i, varMessage.charCodeAt(i));
        }
        if(varMessage.length > 0)
            byteOffset += byteLength;

        // cP.sV_FileName
        var cP_FileName = new DataView(msgBody, byteOffset, byteLength = varFileName.length);
        for(var i=0; i<varFileName.length; i++) {
            cP_FileName.setUint8(i, varFileName.charCodeAt(i));
        }
        if(varFileName.length > 0)
            byteOffset += byteLength;

        console.log("...msgBody=", msgBody);
        var arrayBody = new Uint8Array(msgBody);
        return arrayBody;
    },
    parse : function(stMsgBody) {
        var byteOffset  = 0, byteLength = 0;
        var bodyLength = stMsgBody.length;
        var arrLength = 0;

        this.nMsgType = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;
        
        arrLength = 16;
        this.szMsgKey = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;

        arrLength = 16;
        this.szCaller = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;
        
        arrLength = 16;
        this.szCallee = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;

        arrLength = 16;
        this.szCallBack = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;

        this.nPriority = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;

        arrLength = 16;
        this.szCntUpDate = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;

        this.nReadReply = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;
        this.sV_Subject = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        this.sV_Message = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        this.sV_FileName = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        this.sV_Filler = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;

        if(byteOffset + byteLength < bodyLength) {
            arrLength = (this.sV_Message - this.sV_Subject);
            this.szSubject = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength = arrLength; 
        }
        if(byteOffset + byteLength < bodyLength) {
            arrLength = (this.sV_FileName - this.sV_Message);
            this.szMessage = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength = arrLength;
        }
        if(byteOffset + byteLength < bodyLength) {
            arrLength = (bodyLength - this.msgSize - this.sV_FileName);
            this.szFileName = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength = arrLength;
        }
        return;
    }
}

/*
    int		nResult;
    int		nMsgType;				// __enAgtMsg, SMS:0, LMS:1, MMS:2	
    char	szMsgKey[16];
    char	szQuerySessionKey[64];	// 시스템 생성 키
    char	szErrCode[8];
    char 	szErrText[256];

    // 4+4+16+64+8+256 = 352
*/
function SubmitRsp(buffer) {
    this.msgType = 2;   // RSP
    this.msgName = 3;   // SUBMIT

    this.buffer = buffer;
    this.MsgSize = 4+4+16+64+8+256;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
}

SubmitRsp.prototype = {
    getMsgType : function() {   return this.msgType; },
    getMsgName : function() {   return this.msgName; },
    init : function() {
        this.nResult = 0;
        this.nMsgType = 0;
        this.szMsgKey = "";
        this.szQuerySessionKey = "";
        this.szErrCode = "";
        this.szErrText = "";
    },
    make : function(varResult, varMsgType, varMsgKey, varQuerySessionKey, varErrCode, c) {
        var msgBody = new ArrayBuffer(this.MsgSize);

        var byteOffset  = 0, byteLength = 0;
        
        var nResult = new DataView(msgBody, byteOffset, byteLength = 4); nResult.setUint32(0, varResult); byteOffset += byteLength;
        var nMsgType = new DataView(msgBody, byteOffset, byteLength = 4); nMsgType.setUint32(0, varMsgType); byteOffset += byteLength;

        var szMsgKey = new DataView(msgBody, byteOffset, byteLength = 16); 
        for(var i=0; i<varMsgKey.length; i++) {
            szMsgKey.setUint8(i, varMsgKey.charCodeAt(i));
        }
        byteOffset += byteLength;
    
        var szQuerySessionKey = new DataView(msgBody, byteOffset, byteLength = 64);
        for(var i=0; i<varQuerySessionKey.length; i++) {
            szQuerySessionKey.setUint8(i, varQuerySessionKey.charCodeAt(i));
        }
        byteOffset += byteLength;

        var szErrCode = new DataView(msgBody, byteOffset, byteLength = 8);
        for(var i=0; i<varErrCode.length; i++) {
            szErrCode.setUint8(i, varErrCode.charCodeAt(i));
        }
        byteOffset += byteLength;

        var szErrText = new DataView(msgBody, byteOffset, byteLength = 256);
        for(var i=0; i<varErrCode.length; i++) {
            szErrText.setUint8(i, varErrCode.charCodeAt(i));
        }
        byteOffset += byteLength;

        console.log("...msgBody=", msgBody);
        var arrayBody = new Uint8Array(msgBody);
        return arrayBody;
    },
    parse : function(stMsgBody) {
        var byteOffset  = 0, byteLength = 0;
        var arrLength = 0;

        this.nResult = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;
        this.nMsgType = stMsgBody.readUInt32BE(byteOffset += byteLength); byteLength=4;

        arrLength = 16;
        this.szMsgKey = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=16;

        arrLength = 64;
        this.szQuerySessionKey = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=64;

        arrLength = 8;
        this.szErrCode = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=8;

        arrLength = 256;
        this.szErrText = stMsgBody.subarray(byteOffset += byteLength, byteOffset + arrLength).toString('ascii').replace(/\0/g, ''); byteLength=256;

        return;
    }
}

/*
	short	sDecRate_SMS;			// Decrease Rate for SMS, 0이면 허용 TPS까지, 100이면 전송 금지
	short	sDecRate_LMS;			// Decrease Rate for LMS/MMS, 0이면 허용 TPS까지, 100이면 전송 금지
*/
function KeepAlive(buffer) {
    this.msgType = 3;   // KA
    this.msgName = 0;   // KEEP_ALIVE

    this.buffer = buffer;
    this.MsgSize = 2+2;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
}

KeepAlive.prototype = {
    getMsgType : function() {   return this.msgType; },
    getMsgName : function() {   return this.msgName; },
    init : function() {
        this.sDecRate_SMS = 0;      // Decrease Rate for SMS, 0이면 허용 TPS까지, 100이면 전송 금지
        this.sDecRate_LMS = 0;      // Decrease Rate for LMS/MMS, 0이면 허용 TPS까지, 100이면 전송 금지
    },
    make : function(nDecRate_SMS, nDecRate_LMS) {
        var msgBody = new ArrayBuffer(this.MsgSize);

        var byteOffset  = 0, byteLength = 0;
        
        var sDecRate_SMS = new DataView(msgBody, byteOffset, byteLength = 2); sDecRate_SMS.setUint16(0, nDecRate_SMS); byteOffset += byteLength;
        var sDecRate_LMS = new DataView(msgBody, byteOffset, byteLength = 2); sDecRate_LMS.setUint16(0, nDecRate_LMS); byteOffset += byteLength;

        console.log("...msgBody=", msgBody);
        var arrayBody = new Uint8Array(msgBody);
        return arrayBody;
    },
    parse : function(stMsgBody) {
        var byteOffset  = 0, byteLength = 0;

        this.sDecRate_SMS = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        this.sDecRate_LMS = stMsgBody.readUInt16BE(byteOffset += byteLength); byteLength=2;
        return;
    }
}

module.exports = {
    BindReq,
    BindRsp,
    SubmitReq,
    SubmitRsp,
    KeepAlive,
}