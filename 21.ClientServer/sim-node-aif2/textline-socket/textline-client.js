'use strict';

const TextLineSocket = require('./textline-socket');

class TextLineClient {
    constructor() {
        this.textLineClient = undefined;

        this.isTcp = false;
        this.options = undefined;

        this.CbConnect = undefined;
        this.CbData = undefined;
        this.CbEnd = undefined;
        this.CbClose = undefined;
    }

    set setIsTcp(value) {
        this.isTcp = value
    }
    set setOptions(values) {
        this.options = values
    }
    set setCbConnect(cb) {
        this.CbConnect = cb;
    }
    set setCbData(cb) {
        this.CbData = cb;
    }
    set setCbEnd(cb) {
        this.CbEnd = cb;
    }
    set setCbClose(cb) {
        this.CbClose = cb;
    }

    connect(isTcp, options) {
        this.isTcp = isTcp;
        this.options = options;
        this.connectToServer();
    }

    connectToServer() {
        if(this.textLineClient != undefined) {
            this.textLineClient.removeAllListeners();
            this.textLineClient.destroy();
        }
    
        this.textLineClient = new TextLineSocket();
    
        this.textLineClient.connect(this.isTcp, this.options);
    
        this.textLineClient.addListener('connect', this.OnConnect.bind(this));
        this.textLineClient.addListener('error', this.OnError.bind(this));
        this.textLineClient.addListener('close', this.OnClose.bind(this));
        this.textLineClient.addListener('end', this.OnEnd.bind(this));
        this.textLineClient.addListener('data', this.OnData.bind(this));
    }

    OnConnect(obj) {
        console.log('TextLineClient.OnConnect : === connect success : local = ' + obj._socket.localAddress + ':' + obj._socket.localPort + ', remote = ' + obj._socket.remoteAddress + ':' + obj._socket.remotePort); 
        if (obj._socket.authorized) {
            console.log('TextLineClient.OnConnect : Connection authorized by a Certificate Authority.');
        }
        else {
            console.log('TextLineClient.OnConnect : Connection not authorized: ' + obj._socket.authorizationError);
        }
    
        if (this.CbConnect != undefined) {
            this.CbConnect(obj);
        }
    };

    OnError(err, obj) {
        console.log(err)
    };

    OnClose(hadError, obj) {
        console.log("TextLineClient.OnClose....:", hadError)
        this.CbClose(hadError);

        setTimeout(function(object) {
            object.connectToServer();
        }, 10000, this)
    };

    OnEnd(obj) {
        console.log("TextLineClient.OnEnd....")
        this.CbEnd();
    }

    OnData(data) {
        console.log("TextLineClient.OnData:", data.toString())
        this.CbData(data);
    };

    write(data) {
        this.textLineClient.write(data);
    }
}

module.exports = TextLineClient;
