'strict'

function agtMsgHeader(buffer) {
    this.buffer = buffer;
    this.HeaderSize = 12;

    if(this.buffer == NaN || this.buffer == undefined) {
        this.init();
    }
    else {
        this.parse(buffer);
    }
};
  
var proto = agtMsgHeader.prototype;

proto.init = function() {
    this.cFrame0 = 0xFE;
    this.cFrame1 = 0xFE;
    this.usLength = 0;
    this.ucMsgType = 0;
    this.ucMsgName = 0;
    this.ucVersion = 0;
    this.ucReserved = 0;
    this.ulSeq = 0;    
}

proto.getHeaderSize = function(name) {
    return this.HeaderSize;
}

proto.getLength = function(name){
    return this.usLength;
};

proto.getDataLength = function(name){
    return this.usLength - this.HeaderSize;
};

proto.getMsgType = function() {
    return this.ucMsgType;
};

proto.getMsgName = function() {
    return this.ucMsgName;
};

proto.getSeq = function() {
    return this.ulSeq;
};

proto.make = function(varLength, varMsgType, varMsgName, varSeq) {
    var msgHeader = new ArrayBuffer(this.HeaderSize);
    var byteOffset  = 0, byteLength = 0;

    var cFrame = new DataView(msgHeader, byteOffset, byteLength = 2); cFrame.setInt8(0, 0xFE); cFrame.setInt8(1, 0xFE); byteOffset += byteLength;
    var usLength = new DataView(msgHeader, byteOffset, byteLength = 2); usLength.setUint16(0, this.HeaderSize + varLength); byteOffset += byteLength;
    var ucMsgType = new DataView(msgHeader, byteOffset, byteLength = 1); ucMsgType.setUint8(0, varMsgType); byteOffset += byteLength;   // AGT_MSG_TYPE_REQ:1, AGT_MSG_TYPE_RSP:2, AGT_MSG_TYPE_KA:3
    var ucMsgName = new DataView(msgHeader, byteOffset, byteLength = 1); ucMsgName.setUint8(0, varMsgName); byteOffset += byteLength;   // AGT_MSG_NAME_KA:0, AGT_MSG_NAME_BIND:1
    var ucVersion = new DataView(msgHeader, byteOffset, byteLength = 1); ucVersion.setUint8(0, 3); byteOffset += byteLength;
    var ucReserved = new DataView(msgHeader, byteOffset, byteLength = 1); ucReserved.setUint8(0, 4); byteOffset += byteLength;
    var ulSeq = new DataView(msgHeader, byteOffset, byteLength = 4); ulSeq.setUint32(0, varSeq); byteOffset += byteLength;

    var arrayHeader = new Uint8Array(msgHeader);
    return arrayHeader;
}

proto.parse = function(stHeader) {
    var byteOffset  = 0, byteLength = 0; 
    this.cFrame0 = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;
    this.cFrame1 = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;
    this.usLength = stHeader.readUInt16BE(byteOffset += byteLength); byteLength=2;
    this.ucMsgType = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;   // AGT_MSG_TYPE_REQ:1, AGT_MSG_TYPE_RSP:2, AGT_MSG_TYPE_KA:3
    this.ucMsgName = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;   // AGT_MSG_NAME_KA:0, AGT_MSG_NAME_BIND:1
    this.ucVersion = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;
    this.ucReserved = stHeader.readUInt8(byteOffset += byteLength); byteLength=1;
    this.ulSeq = stHeader.readUInt32BE(byteOffset += byteLength); byteLength=4;

    return;
};

proto.strMsgName = function() {
    var strMsgName = "UNDEFINED";

    switch(this.ucMsgType) {
        case 1 : // REQ
            switch(this.ucMsgName) {
                case 1 :    strMsgName = 'BIND_REQ';   break;
                case 2 :    strMsgName = 'UNBIND_REQ'; break;
                case 3 :    strMsgName = 'SUBMIT_REQ'; break;
                default :   break;
            }
        case 2 : // RSP
            switch(this.ucMsgName) {
                case 1 :    strMsgName = 'BIND_RSP';   break;
                case 2 :    strMsgName = 'UNBIND_RSP'; break;
                case 3 :    strMsgName = 'SUBMIT_RSP'; break;
                default :   break;
            }
        case 3 : // KA
            switch(this.ucMsgName) {
                case 0 :    strMsgName = 'KEEPALIVE';         break;
                default :   break;
            }
    }
    return strMsgName;
}

module.exports = agtMsgHeader;
