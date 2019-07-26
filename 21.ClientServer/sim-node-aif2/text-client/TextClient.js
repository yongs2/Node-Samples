'use strict';

const net = require('net');
const tls = require('tls');
const fs = require('fs');
const util = require('util');
const SocketPacketAssembler = require('socket-packet-assembler');
const sprintf = require('sprintf-js').sprintf

class TextClient {

}

let client = undefined;
let assembler = undefined;
let OnCallBackData = undefined;

const MAX_HEADER_SIZE=16;

TextClient.OnConnect = function () {
    console.log('=== connect success : local = ' + this.localAddress + ':' + this.localPort + ', remote = ' + this.remoteAddress + ':' +this.remotePort);
    if(assembler == undefined) {
        client.removeAllListeners('data');
        assembler = new SocketPacketAssembler(client);
    }

    assembler.on('HEADER', buffer => {
        let strHeaderStart = buffer.slice(0, 4).toString();
        let strHeaderLength = buffer.slice(4, MAX_HEADER_SIZE).toString();
        console.log(">>> HEADER=", strHeaderStart, strHeaderLength);

        let dataLength = Number(strHeaderLength);
        if(dataLength > 0) {
            assembler.readBytes(dataLength, "DATA")
        }
        else {
            assembler.readBytes(MAX_HEADER_SIZE, "HEADER")
        }
        
    });

    assembler.on('DATA', buffer => {
        let data = buffer.toString();
        console.log(">>> DATA.len=", data.length, ", ", data);
        if (OnCallBackData != undefined) {
            OnCallBackData(data);
        }
    });

    assembler.readBytes(MAX_HEADER_SIZE, 'HEADER');
}

TextClient.connectListener = function() {
    if (client.authorized) {
        console.log('Connection authorized by a Certificate Authority.');
    }
    else {
        console.log('Connection not authorized: ' + client.authorizationError);
    }
    client.addListener('connect', this.OnConnect)
    //client.addListener('close', this.OnClose)
    //client.addListener('end', this.OnEnd);
    //client.addListener('error', this.OnError);
    //client.addListener('timeout', this.OnTimeout);
    //client.addListener('drain', this.OnDrain);
    //client.addListener('lookup', this.OnLookup);
}

TextClient.connectToServer = function(isTcp, options) {
    let connection = undefined;

    if(isTcp == false) {
        client = new net.Socket();
        connection = client.connect(options, this.connectListener());
    }
    else {
        client = new tls.TLSSocket();
        connection = client.connect(options, this.connectListener());
    }
    return connection;
}

TextClient.getConnection = function(isTcp, options) {

    client = this.connectToServer(isTcp, options)

    return client;
}

TextClient.writeData = function(data){
    var header = sprintf("FEFE%012d", data.length);
    var success = client.write(header + data);
    if(!success) {
        console.log("Server Send Fail : ", data.length);
    }
}

TextClient.SetCallBackData = function(callback) {
    OnCallBackData = callback;
}

module.exports = TextClient;