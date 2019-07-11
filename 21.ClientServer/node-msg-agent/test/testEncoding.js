var iconv = require('iconv-lite');

//                1234567890123456789012345678901234567890
var varMessage = "SMSSMSSMSSMSTEST입니다 에스엠에스 SMS 1 ";

console.log("message=", varMessage.length, ", Data=", varMessage)

var bufMessage = new Buffer(varMessage);
console.log("varMessage.utf8.legnth=", varMessage.length);
console.log("varMessage.buff.legnth=", bufMessage.length);
console.log("varMessage.euckr.length=", iconv.encode(bufMessage, 'EUC-KR').toString().length);
var cP_Message = iconv.encode(bufMessage, 'euc-kr', {stripBOM: false});
console.log("varMessage.cpBf.length=", cP_Message.length);

// UTF-8 -> EUC-KR : encode(EUC-KR) 로 호출
// EUC-KR -> UTF-8 : decode(EUC-KR) 로 호출

if(true) {  // case 1
    var arrMessage_euckr = iconv.encode(varMessage, "EUC-KR", {stripBOM: true, addBOM: false});
    console.log("1.euckr(", arrMessage_euckr.length, ")= ", arrMessage_euckr);
    
    // encode를 호출했던 buffer 인 arrMessage_euckr 를 가지고 decode를 해야 정상 처리됨
    var varMessage_utf8 = iconv.decode(arrMessage_euckr, 'EUC-KR');
    console.log("1.utf8(", varMessage_utf8.length, ")= ", varMessage_utf8);
}

if(true) {  // case 2
    var arrMessage_euckr = iconv.encode(varMessage, "EUC-KR", {stripBOM: true, addBOM: false});
    var varMessage_euckr = arrMessage_euckr.toString("binary");
    console.log("2.euckr(", varMessage_euckr.length, ")= ", varMessage_euckr);

    var buffer = Buffer.alloc(varMessage_euckr.length, varMessage_euckr, "binary");
    console.log("2.buffer(", buffer.length, ")= ", buffer);   
    
    var varMessage_utf8 = iconv.decode(buffer, 'EUC-KR');
    console.log("2.utf8(", varMessage_utf8.length, ")= ", varMessage_utf8);    
}
