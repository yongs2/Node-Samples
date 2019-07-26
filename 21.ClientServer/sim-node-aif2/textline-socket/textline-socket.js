'use strict';

const Socket = require('net').Socket;
const TLSSocket = require('tls').TLSSocket;
const Duplex = require('stream').Duplex;
const fs = require('fs');
const sprintf = require('sprintf-js').sprintf

class TextLineSocket extends Duplex {
    constructor(socket) {
        super({ objectMode: true });
        this._readingPaused = false;
        this._socket;
        
        this._signature = "FEFE";
        this._dataLengthSize = 12;
        this._MaxDataLengthSize = 2 ** 18;  // 256KiB
        this._readState = 'SIGNATURE';  // SIGNATURE, LENGTH, PAYLOAD
        this._bufSignature;
        this._bufLength;
        this._dataLength;

        if (socket) this._wrapSocket(socket);
    }

    connect(isTcp, options) {
        if(isTcp == true) { // TCP
            this._wrapSocket(new Socket());
            this._socket.connect(options);
        }
        else {  // TLS
            this._wrapSocket(new TLSSocket());
            this._socket.connect(options);
        }
        return this;
    }

    _wrapSocket(socket) {
        this._socket = socket;
        this._socket.on('close', hadError => this.emit('close', hadError, this));
        this._socket.on('connect', () => this.emit('connect', this));
        this._socket.on('secureConnect', () => this.emit('secureConnect', this))
        this._socket.on('drain', () => this.emit('drain', this));
        this._socket.on('end', () => this.emit('end', this));
        this._socket.on('error', err => this.emit('error', err, this));
        this._socket.on('lookup', (err, address, family, host) => this.emit('lookup', err, address, family, host, this)); // prettier-ignore
        this._socket.on('ready', () => this.emit('ready', this));
        this._socket.on('timeout', () => this.emit('timeout', this));
        this._socket.on('readable', this._onReadable.bind(this));
    }

    _onReadable() {
        //console.log("_onReadable()...ReadState=", this._readState);
        while (!this._readingPaused) {
            if(this._readState == 'SIGNATURE') {
                // 첫번째로 signature 를 읽어야 한다
                this._bufSignature = this._socket.read(this._signature.length);
                if (!this._bufSignature) return;

                if(this._bufSignature.toString() != this._signature) {
                    this._bufSignature = undefined;
                    return;
                }
                this._readState = 'LENGTH';
            }

            if(this._readState == 'LENGTH') {
                // 2번째로 dataLength를 읽어야 한다.
                this._bufLength = this._socket.read(this._dataLengthSize);
                if(!this._bufLength) {
                    this._bufSignature = undefined;
                    return;
                }

                this._dataLength = Number(this._bufLength.toString());
                if (this._dataLength > this._MaxDataLengthSize) {
                    this.socket.destroy(new Error('Max length exceeded:' + this._dataLength + "/" + this._MaxDataLengthSize));
                    this._readState = 'SIGNATURE';
                    this._bufLength = undefined;
                    return;
                }
                this._readState = 'PAYLOAD';
            }
    
            if(this._readState == 'PAYLOAD') {
                let body = this._socket.read(this._dataLength);
                if (!body) {
                    this._bufLength = undefined;
                    //console.log("  >>> ReadState=", this._readState, ", unshift, Body=[]");
                    return;
                }

                let pushOk = this.push(body);
                //console.log("  >>> ReadState=", this._readState, ", PushOK=", pushOk, ",Body=[", body.toString(), "]");
                if (!pushOk) {
                    this._readingPaused = true;
                }
                else {
                    this._readState = 'SIGNATURE';
                }
            }
        }
    }

    _read() {
        this._readingPaused = false;
        setImmediate(this._onReadable.bind(this));
    }

    _write(obj, encoding, cb) {
        let bodyBytes = Buffer.byteLength(obj);
        var header = this._signature + sprintf("%012d", bodyBytes);
        let headerBytes = Buffer.byteLength(header);
        let buffer = Buffer.alloc(headerBytes + bodyBytes);
        buffer.write(header);
        buffer.write(obj, header.length);
        this._socket.write(buffer, cb);
    }
    _final(cb) {
        this._socket.end(cb);
    }
}

module.exports = TextLineSocket;