#!/usr/local/bin/python3
# -*- coding:utf-8 -*-
# python 3.7.3
#
# TextClientProtocol.py
#

from twisted.protocols.basic import LineReceiver
from twisted.internet.protocol import ClientFactory, ServerFactory
from twisted.internet import endpoints, reactor, ssl

import json

MAX_HEADER_SIZE=16

class TextClientProtocol(LineReceiver):
    def __init__(self):
        print ('TEXT.__init__')
        self.m_nState = 0
        self.received = ""
        self.waitMsg = 0    # 0 이면 header, 1 이면 데이터
        self.waitMsgSize = MAX_HEADER_SIZE
        self.ENCODE_STR = 'utf-8'
      
    def connectionMade(self):
        print ('-- connectionMade() called')
        
        self.factory.clientReady(self)
        self.m_nState += 1 # For Next Test, Request and Response
        
    def dataReceived(self, line):
        self.received += line.decode(self.ENCODE_STR)
        print (">>> START DataReceived.... State=%d, Len=%d, self.received=%d\r\n" % (self.m_nState, len(line), len(self.received)))
        
        nOffset = 0
        while len(self.received) >= self.waitMsgSize :
            if self.waitMsg == 0 :  # Header
                self.Header = (self.received[0:MAX_HEADER_SIZE])
                print ("    >>> ", self.received[0:MAX_HEADER_SIZE])
                
                if self.Header[0:4] != "FEFE" :
                    #raise Exception("Invalid Header : " + self.Header[0:4])
                    print ("    >>> SKIP.Invalid Header:" + self.Header[0:4])
                    self.received = self.received[4:]
                    continue

                self.received = self.received[self.waitMsgSize:]

                # 다음은 데이터를 기다려야 함
                self.waitMsg = 1
                self.waitMsgSize = int(self.Header[4:MAX_HEADER_SIZE])

                print ("   >>> HEADER.Next WaitMsg=%d, MsgSize=%d, Received=%d\r\n" % (self.waitMsg, self.waitMsgSize, len(self.received)))
            else  :   # Data
                body = self.received[0:self.waitMsgSize]

                self.OnData(body)

                self.received = self.received[self.waitMsgSize:]

                # 다음은 헤더를 기다려야 함
                self.waitMsg = 0
                self.waitMsgSize = MAX_HEADER_SIZE     

                print ("   >>> BODY.Next WaitMsg=%d, MsgSize=%d, Received=%d\r\n" % (self.waitMsg, self.waitMsgSize, len(self.received)))
        print ("<<< Done.DataReceived....State=%d, Len=%d, self.received=%d\r\n" % (self.m_nState, len(line), len(self.received)))

    def connectionLost(self, reason):
        print ('-- clientConnectionLost() called')
        #reactor.stop()

    def OnData(self, body) :
        print ("TEXT.Body:", body)
        parser = json.loads(body)
        keys = list(parser.keys())
        print('TEXT.HandleMessage, keys=[%s]' % (keys))
        if 'head' == keys[0] :
            if 'TEST_REQ' == parser['head']['MsgName'] :
                print ("RECV TEST_REQ, ", parser['head']['Seq'], parser['head']['Ret'])
        if 'body' == keys[1] :
            print ("RECV BODY : ", parser['body']['DATA'])

    def writeMsg(self, body) :
        json.loads(body)
        header = "FEFE" + ("%012d" % len(body))
        print (">>> writeMsg: ", header)
        self.transport.write(header.encode())
        self.transport.write(body.encode())

    def writeJson(self, dictJson):
        msg = json.dumps(dictJson)
        self.writeMsg(msg)


class MyFactory(ClientFactory):
    def __init__(self, szClientId):
        print ('MyFactory.__init__ szClientId=%s' % (szClientId))
        self.startFactory()
        self.m_szClientId = szClientId
        
    def clientConnectionFailed(self, connector, reason):
        reactor.stop()
       
    def clientConnectionLost(self, connector, reason):
        print ('-- clientConnectionLost() called')
        #reactor.stop()

    def startFactory(self):
        print ('-- startFactory() called')
        self.messageQueue = []
        self.clientInstance = None
       
    def clientReady(self, instance):
        print ('-- clientReady() called')
        self.clientInstance = instance
        for msg in self.messageQueue:
            self.sendMessge(msg)
        
    def sendMessage(self, msg):
        if self.clientInstance is not None:
            print ('$ client instance is not null')
            self.clientInstance.sendLine(msg)
        else:
            print ('$ client instance is null')
            self.messageQueue.append(msg)
