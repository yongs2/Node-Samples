'use strict';

const TextClient = require('./TextClient')
let options_tcp = {
    port: 4000,         // config.AIF.PORT, 
    host: "127.0.0.1",  //config.AIF.HOST
};
let options_ssl = {
    port: 4443,         // config.AIF.PORTS, 
    host: "127.0.0.1",  // config.AIF.HOST,

    // Necessary only if using the client certificate authentication
    key: '',
    cert: '',

    // Necessary only if the server uses the self-signed certificate
    ca: '',
    strictSSL: true, // allow us to use our self-signed cert for testing
    rejectUnauthorized: true,  // Trust to listed certificates only. Don't trust even google's certificates.
    checkServerIdentity: (servername, cert) => { console.log("servername=", servername, ", cert=", cert); return null; },
};


//let client = TextClient.getConnection(false, options_tcp);
let client = TextClient.getConnection(true, options_ssl);

if(client != undefined) {
    let BindReq = {
        "head":{
            "MsgName":"BIND_REQ",
            "Seq":1,
            "Ret":0,
            "Version":"1.0.0"
        },
        "body":{
            "szLoginId":"LOGIN_ID", "szToken":"TOKEN", "cRvSMS_F":0, "cRvMMS_F" : 0, "cEnc_F" : 0
        }
    };
    TextClient.SetCallBackData(function(data) {
        console.log("aif-client:", data);
    });
    TextClient.writeData(JSON.stringify(BindReq));
}