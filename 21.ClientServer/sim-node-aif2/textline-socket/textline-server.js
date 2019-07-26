'use strict';

const net = require('net');
const tls = require('tls');
const TextLineSocket = require('./textline-socket');

class TextLineServer {
    constructor() {
        this.serverTcp = undefined;
        this.serverTls = undefined;

        this.optionsTcp = undefined;
        this.optionsTls = undefined;

        this.CbConnection = undefined;
    }

    set setOptionsTcp(values) {
        this.optionsTcp = values
    }
    set setOptionsTls(values) {
        this.optionsTls = values
    }
    set setCbConnection(cb) {
        this.CbConnection = cb;
    }

    Listen() {
        if(this.optionsTcp != undefined) {
            this.serverTcp = net.createServer(this.connectListener.bind(this));
            this.serverTcp.listen(this.optionsTcp.port, function() { 
	            console.log('Server listening for connection : TCP');
            });
        }
        if(this.optionsTls != undefined) {
            this.serverTls = tls.createServer(this.optionsTls, this.connectListener.bind(this));
            this.serverTls.listen(this.optionsTls.port, function() {
                console.log('Server listening for connection : TLS'); 
            });
        }
    }

    connectListener(client, obj) {
        console.log('Client connected :' + client.localAddress + ':' + client.localPort + ', remote = ' + client.remoteAddress + ':' + client.remotePort); 
    
        let textLineClient = new TextLineSocket(client);
        
        if (this.CbConnection != undefined) {
            this.CbConnection(textLineClient, obj);
        }
    }
}

module.exports = TextLineServer;