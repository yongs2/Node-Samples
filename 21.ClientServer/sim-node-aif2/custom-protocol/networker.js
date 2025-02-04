'use strict';

//const debug = require('debug')('network');
const sprintf = require('sprintf-js').sprintf

const MAX_HEADER_SIZE=16;

function Networker(socket, handler) {
  this.socket = socket;
  this._packet = {};
  
  this._process = false;
  this._state = 'HEADER';
  this._payloadLength = 0;
  this._bufferedBytes = 0;
  this.queue = [];

  this.handler = handler;
}

Networker.prototype.init = function () {
  this.socket.on('data', (data) => {
    this._bufferedBytes += data.length;
    this.queue.push(data);

    this._process = true;
    this._onData();
  });

  this.socket.on('served', this.handler);
};

Networker.prototype._hasEnough = function (size) {
  if (this._bufferedBytes >= size) {
    return true;
  }
  this._process = false;
  return false;
}

Networker.prototype._readBytes = function (size) {
  let result;
  this._bufferedBytes -= size;

  if (size === this.queue[0].length) {
    return this.queue.shift();
  }

  if (size < this.queue[0].length) {
    result = this.queue[0].slice(0, size);
    this.queue[0] = this.queue[0].slice(size);
    return result;
  }
  
  result = Buffer.allocUnsafe(size);
  let offset = 0;
  let length;
  
  while (size > 0) {
    length = this.queue[0].length;

    if (size >= length) {
      this.queue[0].copy(result, offset);
      offset += length;
      this.queue.shift();
    } else {
      this.queue[0].copy(result, offset, 0, size);
      this.queue[0] = this.queue[0].slice(size);
    }

    size -= length;
  }

  return result;
}

Networker.prototype._getHeader = function () {
  if (this._hasEnough(MAX_HEADER_SIZE)) {
    let header = this._readBytes(MAX_HEADER_SIZE);
    console.log("_getHeader:", header);
    let strHeaderStart = header.slice(0, 4).toString();
    this._payloadLength = Number(header.slice(4, MAX_HEADER_SIZE).toString());

    this._state = 'PAYLOAD';
  }
}

Networker.prototype._getPayload = function () {
  if (this._hasEnough(this._payloadLength)) {
    let received = this._readBytes(this._payloadLength);
    console.log("_getPayload:", received);
    this.socket.emit('served', received);
    this._state = 'HEADER';
  }
}

Networker.prototype._onData = function (data) {
  while (this._process) {
    switch (this._state) {
      case 'HEADER':
        this._getHeader();
        break;
      case 'PAYLOAD':
        this._getPayload();
        break;
    }
  }
}

Networker.prototype.send = function (message) {
  let buffer = Buffer.from(message);
  this._header(buffer.length);
  this._packet.message = buffer;
  this._send();
}

Networker.prototype._header = function (messageLength) {
  this._packet.header = sprintf("FEFE%012d", messageLength);
};

Networker.prototype._send = function () {
  console.log('Attempting to write...', this._packet);
  this.socket.write(this._packet.header);
  this.socket.write(this._packet.message);
  this._packet = {};
};

module.exports = Networker;