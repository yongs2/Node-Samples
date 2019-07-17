#!/usr/local/bin/python3
# -*- coding:utf-8 -*-
# python 3.4.3
#

from twisted.protocols.basic import LineReceiver
from twisted.internet.protocol import ClientFactory, ServerFactory
from twisted.internet import endpoints, reactor, ssl

import string
import re
import time
import sys
import struct
from array import array
import enum
from time import sleep
from datetime import datetime

from importlib import reload
reload(sys)
print('getdefaultencoding "%s"' % sys.getdefaultencoding())
print('sys.stdin.encoding "%s"' % sys.stdin.encoding)
print('sys.stdout.encoding "%s"' % sys.stdout.encoding)
print('sys.stderr.encoding "%s"' % sys.stderr.encoding)
str = u"한글테스트-utf8"
print(type(str))
print(str.encode('euc-kr').decode('euc-kr'))

ENCODE_STR='euc-kr'

class AGT_MSG_TYPE(enum.Enum) :
    REQ    = 1     # Request
    RSP    = 2     # Response
    KA     = 3     # Keep Alive

class AGT_MSG_NAME(enum.Enum) :
    KA         = 0
    BIND       = 1
    UNBIND     = 2
    SUBMIT     = 3
    REPORT     = 4
    READREPLY  = 5
    MO         = 6

class AGT_MSG(enum.Enum) :
    SMS             = 0
    LMS             = 1
    MMS             = 2
    MAX             = 3

def Dump(data, len) :
    #print "Dump: data=[%s], len=%d" % (data, len)
    #binary = struct.unpack("!" + repr(len) +"B", data)
    nIndex = 0
    nMaxLoop = int(len / 16) + 1
    print ("Dump...................(%d, %d) " % (len, nMaxLoop))
    nStart = 0
    for x in range(0, nMaxLoop) :
        nDisplayLen = len - (nStart +1)*16
        if nDisplayLen >= 0: nDisplayLen = 16
        else:                nDisplayLen = 16 + nDisplayLen
        
        #print "Data(%d, %d)=[%s]" % (nStart*16, nStart*16+nDisplayLen, data[nStart*16 : nStart*16+nDisplayLen])
        binary = struct.unpack("!" + repr(nDisplayLen) +"B", data[nStart*16 : nStart*16+nDisplayLen])
        print ("0x%04X |" % (nStart*16), end='')
        string = ""
        nIndex = 0
        for y in range(0, nDisplayLen) :
            print ("%02X" % (binary[nIndex]), end='')
            string += ("%c" % binary[nIndex])
            nIndex += 1
        print ("|%s|" % (string.encode(ENCODE_STR, 'replace')))
        nStart = nStart + 1

MAX_MSG_SIZE = 2048
MAX_HEADER_SIZE = 16
MAX_BODY_SIZE = MAX_MSG_SIZE - MAX_HEADER_SIZE  # 2048 - 16 = 2032

class AGT_MSG_HEADER(object) :
    MESSAGE_STR="AGT_MSG_HEADER"
    LABELS = [
         ('cFrame0',        'B')
        ,('cFrame1',        'B')
        ,('usLength',       'H')
        ,('ucMsgType',      'B')
        ,('ucMsgName',      'B')
        ,('ucVersion',      'B')
        ,('ucReserverd',    'b')
        ,('ulSeq',          'Q')
    ] # 2+2+1+1+1+1 + 8 = 16 bytes
    data = {}
    
    def __init__(self, *data):
        #print ('%s data[%s], data.len=%d, is=%d ' % (self.MESSAGE_STR, type(data), len(data), (data is not None)))
        if len(data) > 0 :
            fmt = '!' + ''.join([label[1] for label in self.LABELS])
            #print ('%s fmt = [%s][%d] ' % (self.MESSAGE_STR, fmt, struct.calcsize(fmt)))
            self.data = struct.unpack(fmt, data[0])
        else :
            for idx, label in enumerate(self.LABELS):
                #print ('1.GET [%d] label=%s, 2=%s' % (idx, label[0], label[1]))
                self.data[idx] = '0'
    
    def __getattr__(self, name):
        #print ('%s getattr, name=%s' % (self.MESSAGE_STR, name))
        for idx, label in enumerate(self.LABELS):
            #print ('2.GET [%d] label=%s, 2=%s' % (idx, label[0], label[1]))
            if label[0] == name:
                return self.data[idx]
        #raise ValueError
    
    def __setattr__(self, name, value):
        #print ('%s setattr, name=%s, value=%s' % (self.MESSAGE_STR, name, value))
        for idx, label in enumerate(self.LABELS):
            #print ('%s setattr, idx=%d, label0=%s, label1=%s, value=%s' % (self.MESSAGE_STR, idx, label[0], label[1], value[idx]))
            if name == 'data' :
                if len(label[0]) > 0:
                    if label[1].find('s') >= 0 :
                        try :
                            self.data[idx] = value[idx].decode(ENCODE_STR).strip()
                        except:
                            self.data[idx] = value[idx]
                    else :
                        self.data[idx] = value[idx]
            else :
                for idx, label in enumerate(self.LABELS):
                    if label[0] == name:
                        if label[1].find('I') >= 0 :
                            self.data[idx] = int(value)
                        else :
                            self.data[idx] = value
                        return self.data[idx]
                raise ValueError
    
    def __len__(self) :
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.calcsize(fmt)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0], self.data[1]
                                , self.data[2]
                                , self.data[3], self.data[4]
                                , self.data[5], self.data[6]
                                , self.data[7])

class AGT_MSG_BASE(object) :
    MESSAGE_STR="AGT_MSG_BASE"
    LABELS = [
         ('szExta',          '2032s') ]       # 2048 -16 = 2032
    data = {}
    
    def __init__(self, *data):
        #print ('AGT_MSG_BASE.%s data[%s](%s), data.len=%d, is=%d ' % (self.MESSAGE_STR, data[0], type(data[0]), len(data[0]), (data is not None)))
        if len(data[0]) > 0 :
            # LABELS 을 기준으로 여분의 데이터가 있다면, szExtra 를 추가한다.
            fmt = '!' + ''.join([label[1] for label in self.LABELS])
            nLabelSize = struct.calcsize(fmt)
            labelStr = ""
            #print ("1.INIT size=[%d] MAX_BODY_SIZE=%d, self.data=[%s]" % (nLabelSize, len(data[0][0]), self.data))
            if nLabelSize < len(data[0][0]) :
                labelStr = '%ds' % (len(data[0][0]) - nLabelSize)
                self.LABELS.append(('szExtra', labelStr))
            #print ("1.INIT LABLES=[%s][%s]" % (self.LABELS, labelStr))
            
            fmt = '!' + ''.join([label[1] for label in self.LABELS])
            print ('%s fmt = [%s][%d], data[%s]' % (self.MESSAGE_STR, fmt, struct.calcsize(fmt), type(data[0][0])))
            self.data = struct.unpack(fmt, data[0][0])
        else :
            for idx, label in enumerate(self.LABELS):
                #print ('1.GET [%d] label=%s, 2=%s' % (idx, label[0], label[1]))
                if label[1].find('s') >= 0 :
                    self.data[idx] = '0' #'\0' * nLabelSize
                else :
                    self.data[idx] = 0
    
    def __getattr__(self, name):
        #print ('%s getattr, name=%s' % (self.MESSAGE_STR, name))
        for idx, label in enumerate(self.LABELS):
            #print ('2.GET [%d] label=%s, 2=%s' % (idx, label[0], label[1]))
            if label[0] == name:
                return self.data[idx]
        #raise ValueError
    
    def __setattr__(self, name, value):
        #print ('%s setattr, name=%s, value=%s' % (self.MESSAGE_STR, name, value))
        for idx, label in enumerate(self.LABELS):
            #print ('%s setattr, idx=%d, label0=%s, label1=%s, value=%s' % (self.MESSAGE_STR, idx, label[0], label[1], value[idx]))
            if name == 'data' :
                if len(label[0]) > 0:
                    if label[1].find('s') >= 0 :
                        self.data[idx] = value[idx].decode(ENCODE_STR, 'ignore').strip()
                    else :
                        self.data[idx] = value[idx]
            else :
                for idx, label in enumerate(self.LABELS):
                    if label[0] == name:
                        if label[1].find('I') >= 0 :
                            self.data[idx] = int(value)
                        else :
                            self.data[idx] = value
                        return self.data[idx]
                raise ValueError
    
    def __len__(self) :
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.calcsize(fmt)

class AGT_KEEP_ALIVE(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_KEEP_ALIVE"
    LABELS = [
         ('sDecRate_SMS',   'H')
        ,('sDecRate_LMS',   'H')
    ]   # 2+2 = 4 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_KEEP_ALIVE, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt, self.data[0], self.data[1])

class AGT_BIND_REQ(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_BIND_REQ"
    LABELS = [
         ('szLoginId',      '32s')
        ,('szToken',        '256s')
        ,('cRvSMS_F',       'c')
        ,('cRvMMS_F',       'c')
        ,('cEnc_F',         'c')
        ,('cFiller',        'c')
    ]   # 32+256+1+1+1+1 = 292 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_BIND_REQ, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0].encode(ENCODE_STR)
                                , self.data[1].encode(ENCODE_STR)
                                , self.data[2]
                                , self.data[3]
                                , self.data[4]
                                , self.data[5]
                            )

class AGT_BIND_RSP(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_BIND_RSP"
    LABELS = [
         ('nResult',        'i')
        ,('sMaxTPS_SMS',    'h')
        ,('sMaxTPS_LMS',    'h')
    ]   # 4+1+1 = 6 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_BIND_RSP, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1]
                                , self.data[2]
                            )

class AGT_UNBIND_REQ(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_UNBIND_REQ"
    LABELS = [
         ('szLoginId',      '32s')
    ]   # 32 = 32 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_UNBIND_REQ, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0].encode(ENCODE_STR))

class AGT_UNBIND_RSP(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_UNBIND_RSP"
    LABELS = [
         ('nResult',        'i')
    ]   # 4+1+1 = 6 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_UNBIND_RSP, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0])

class AGT_SUBMIT_REQ(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_SUBMIT_REQ"
    LABELS = [
         ('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szCaller',       '16s')
        ,('szCallee',       '16s')
        ,('szCallBack',     '16s')
        ,('nPriority',      'i')    # 우선순위, 0:낮음(default), 1:높음
        ,('szCntUpDate',    '16s')  # Contents Upload 일시
        ,('nReadReply',     'i')    # ReadyReply 여부
        ,('sV_Subject',     'H')    # 제목
        ,('sV_Message',     'H')    # 문자 내용
        ,('sV_FileName',    'H')    # 사전에 HTTP로 Upload한 Contents 파일명
        ,('sV_Filler',      'H')    # 여분
    ]   # 4+16+16+16+16+4+16+4+2+2+2+2+{}{}{} = 100 + {}+{}+{} bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_SUBMIT_REQ, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1].encode(ENCODE_STR)
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                                , self.data[5]
                                , self.data[6].encode(ENCODE_STR)
                                , self.data[7]
                                , self.data[8]
                                , self.data[9]
                                , self.data[10]
                                , self.data[11]
                            )

class AGT_SUBMIT_RSP(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_SUBMIT_RSP"
    LABELS = [
         ('nResult',        'i')
        ,('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szQuerySessionKey', '64s')   # 시스템 생성 키
        ,('szErrCode',      '8s')
	    ,('szErrText',      '256s')

    ]   # 4+4+16+64+32 = 120 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_SUBMIT_RSP, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1]
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                                , self.data[5].encode(ENCODE_STR)
                            )

class AGT_REPORT_REQ(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_REPORT_REQ"
    LABELS = [
         ('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szQuerySessionKey', '64s')   # 시스템 생성 키
        ,('szCaller',       '16s')
        ,('szCallee',       '16s')
        ,('szSendDate',     '16s')  # 전송 시간
        ,('nSendResult',    'i')    # 전송 결과, 0:Success, 1:Fail
        ,('szErrCode',      '8s')   # 에러코드
        ,('szErrText',      '256s') # 에러텍스트
        ,('szReportID',     '32s')  # ReportID
    ]   # 4+16+64+16+16+16+4+8+256+32 = 432 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_REPORT_REQ, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1].encode(ENCODE_STR)
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                                , self.data[5].encode(ENCODE_STR)
                                , self.data[6]
                                , self.data[7].encode(ENCODE_STR)
                                , self.data[8].encode(ENCODE_STR)
                                , self.data[9].encode(ENCODE_STR)
                            )

class AGT_REPORT_RSP(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_REPORT_RSP"
    LABELS = [
         ('nResult',        'i')
        ,('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szQuerySessionKey', '64s')   # 시스템 생성 키
        ,('szReportID',     '32s')  # ReportID
    ]   # 4+4+16+64+32 = 120 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_REPORT_RSP, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1]
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                            )

class AGT_READREPLY_REQ(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_READREPLY_REQ"
    LABELS = [
         ('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szQuerySessionKey', '64s')   # 시스템 생성 키
        ,('szCaller',       '16s')
        ,('szCallee',       '16s')
        ,('szChkdDate',     '16s')  # 확인 시간
        ,('nSendResult',    'i')    # 전송 결과, 0:Success, 1:Fail
        ,('szErrCode',      '8s')   # 에러코드
        ,('szErrText',      '256s') # 에러텍스트
        ,('szReportID',     '32s')  # ReportID
    ]   # 4+16+64+16+16+16+4+8+256+32 = 432 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_READREPLY_REQ, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1].encode(ENCODE_STR)
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                                , self.data[5].encode(ENCODE_STR)
                                , self.data[6]
                                , self.data[7].encode(ENCODE_STR)
                                , self.data[8].encode(ENCODE_STR)
                                , self.data[9].encode(ENCODE_STR)
                            )

class AGT_READREPLYT_RSP(AGT_MSG_BASE) :
    MESSAGE_STR="AGT_READREPLYT_RSP"
    LABELS = [
         ('nResult',        'i')
        ,('nMsgType',       'i')    # __enAgtMsg, SMS:0, LMS:1, MMS:2
        ,('szMsgKey',       '16s')
        ,('szQuerySessionKey', '64s')   # 시스템 생성 키
        ,('szReportID',     '32s')  # ReportID
    ]   # 4+4+16+64+32 = 120 bytes
    data = {}
    
    def __init__(self, *data):
        super(AGT_READREPLYT_RSP, self).__init__(data)
        
    def Pack(self) :
        print ('%s Pack()...%s ' % (self.MESSAGE_STR, self.data))
        fmt = '!' + ''.join([label[1] for label in self.LABELS])
        return struct.pack(fmt  , self.data[0]
                                , self.data[1]
                                , self.data[2].encode(ENCODE_STR)
                                , self.data[3].encode(ENCODE_STR)
                                , self.data[4].encode(ENCODE_STR)
                            )

class MrpClientProtocol(LineReceiver):
    def __init__(self):
        print ('AIF.__init__')
        self.m_nState = 0
        self.szLoginId = ""
        self.szToken = ""
        self.received = bytearray()
        self.waitMsg = 0    # 0 이면 header, 1 이면 데이터
        self.waitMsgSize = MAX_HEADER_SIZE
        self.agtMsgHeader = AGT_MSG_HEADER()

    def GetId(self):
        return self.factory.m_szEapClientId
        
    def connectionMade(self):
        print ('-- connectionMade() called')
        
        self.factory.clientReady(self)
        
        self.m_nState += 1 # For Next Test, Request and Response
        
    def dataReceived(self, line):
        self.received.extend(line)
        print (">>> START DataReceived.... State=%d, Len=%d, self.received=%d\r\n" % (self.m_nState, len(line), len(self.received)))
        
        nOffset = 0
        while len(self.received) >= self.waitMsgSize :
            if self.waitMsg == 0 :  # Header
                self.agtMsgHeader = AGT_MSG_HEADER(self.received[0:MAX_HEADER_SIZE])
                Dump(self.received, MAX_HEADER_SIZE)

                self.received = self.received[self.waitMsgSize:]

                # 다음은 데이터를 기다려야 함
                self.waitMsg = 1
                self.waitMsgSize = self.agtMsgHeader.usLength - len(self.agtMsgHeader)

                print ("    >>> AIF.type=0x%x Name=0x%x, Len=%d, ulSeq=%d, bodyLen=%d" % (
                    self.agtMsgHeader.ucMsgType
                    , self.agtMsgHeader.ucMsgName
                    , self.agtMsgHeader.usLength
                    , self.agtMsgHeader.ulSeq
                    , self.agtMsgHeader.usLength - len(self.agtMsgHeader)))

                print ("   >>> HEADER.Next WaitMsg=%d, MsgSize=%d, Received=%d\r\n" % (self.waitMsg, self.waitMsgSize, len(self.received)))
            else  :   # Data
                body = self.received[0:self.waitMsgSize]

                self.received = self.received[self.waitMsgSize:]

                # 다음은 헤더를 기다려야 함
                self.waitMsg = 0
                self.waitMsgSize = MAX_HEADER_SIZE     

                if(self.agtMsgHeader.ucMsgType == AGT_MSG_TYPE.REQ.value) :
                    if(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.BIND.value) :
                        self.OnBindReq(agtMsgHeader, body)
                        self.m_nState = 1
                    if(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.UNBIND.value) :
                        self.OnUnbindReq(agtMsgHeader, body)
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.SUBMIT.value) :
                        self.OnSubmitReq(agtMsgHeader, body)
                        self.m_nState = 2
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.REPORT.value) :
                        self.OnReportReq(agtMsgHeader, body)
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.READREPLY.value) :
                        self.OnReadReplyReq(agtMsgHeader, body)
                elif (self.agtMsgHeader.ucMsgType == AGT_MSG_TYPE.RSP.value) :
                    if(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.BIND.value) :
                        pass
                    if(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.UNBIND.value) :
                        pass
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.SUBMIT.value) :
                        pass
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.REPORT.value) :
                        pass
                    elif(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.READREPLY.value) :
                        pass
                elif (self.agtMsgHeader.ucMsgType == AGT_MSG_TYPE.KA.value) :
                    if(self.agtMsgHeader.ucMsgName == AGT_MSG_NAME.KA.value) :
                        self.OnKeepAlive(agtMsgHeader, body)

                print ("   >>> BODY.Next WaitMsg=%d, MsgSize=%d, Received=%d\r\n" % (self.waitMsg, self.waitMsgSize, len(self.received)))
        print ("<<< Done.DataReceived....State=%d, Len=%d, self.received=%d\r\n" % (self.m_nState, len(line), len(self.received)))

    def connectionLost(self, reason):
        print ('-- clientConnectionLost() called')
        #reactor.stop()


    def OnBindReq(self, reqHeader, body):
        bindReq = AGT_BIND_REQ(body)
        loginId = bindReq.szLoginId
        szToken = bindReq.szToken
        print ("    ID=[%s] Token=[%s]" % (loginId.strip('\x00'), szToken.strip('\x00')))

        bindRsp = AGT_BIND_RSP()
        bindRsp.nResult = 0
        bindRsp.sMaxTPS_SMS = 15
        bindRsp.sMaxTPS_LMS = 5
        stBody = bindRsp.Pack()

        lenHeader = len(reqHeader)
        lenBody = len(bindRsp)
        ucVersion = reqHeader.ucVersion
        ulSeq = reqHeader.ulSeq

        rspHeader = AGT_MSG_HEADER()
        rspHeader.cFrame0 = 0xFE
        rspHeader.cFrame1 = 0xFE
        rspHeader.usLength = lenHeader + lenBody
        rspHeader.ucMsgType = int(AGT_MSG_TYPE.RSP.value)
        rspHeader.ucMsgName = int(AGT_MSG_NAME.BIND.value)
        rspHeader.ucVersion = ucVersion
        rspHeader.ucReserverd = 0
        rspHeader.ulSeq = ulSeq
        stHeader = rspHeader.Pack()

        nWrite = self.transport.write(stHeader + stBody)
        print ("    <<< AGT_BIND_RSP")

    def OnUnbindReq(self, reqHeader, body):
        unbindReq = AGT_UNBIND_REQ(body)
        szLoginId = unbindReq.szLoginId

    def OnSubmitReq(self, reqHeader, body):
        submitReq = AGT_SUBMIT_REQ(body)
        nMsgType = submitReq.nMsgType
        szMsgKey = submitReq.szMsgKey.strip('\x00')
        szCaller = submitReq.szCaller.strip('\x00')
        szCallee = submitReq.szCallee.strip('\x00')
        szCallBack = submitReq.szCallBack.strip('\x00')
        szExtra = submitReq.szExtra.strip('\x00')
        print ("    Msg[%d,%s] Caller=[%s] Callee=[%s] CallBack=[%s] Extra[%s](%d)" % (nMsgType, szMsgKey, szCaller, szCallee, szCallBack
            , szExtra
            , len(szExtra)))

        print ("    Subject=[%s], Message=[%s], FileName=[%s]" % (
            szExtra[submitReq.sV_Subject : submitReq.sV_Message]
            , szExtra[submitReq.sV_Message : submitReq.sV_FileName]
            , szExtra[submitReq.sV_FileName : submitReq.sV_Filler]))

        submitRsp = AGT_SUBMIT_RSP()
        submitRsp.nResult = 0
        submitRsp.nMsgType = nMsgType
        submitRsp.szMsgKey = szMsgKey
        submitRsp.szQuerySessionKey = "SYSTEM_CREATE_KEY_0001"
        submitRsp.szErrCode = "0"
        submitRsp.szErrText = "SUCCESS"

        stBody = submitRsp.Pack()

        lenHeader = len(reqHeader)
        lenBody = len(submitRsp)
        ucVersion = reqHeader.ucVersion
        ulSeq = reqHeader.ulSeq

        rspHeader = AGT_MSG_HEADER()
        rspHeader.cFrame0 = 0xFE
        rspHeader.cFrame1 = 0xFE
        rspHeader.usLength = lenHeader + lenBody
        rspHeader.ucMsgType = int(AGT_MSG_TYPE.RSP.value)
        rspHeader.ucMsgName = int(AGT_MSG_NAME.SUBMIT.value)
        rspHeader.ucVersion = ucVersion
        rspHeader.ucReserverd = 0
        rspHeader.ulSeq = ulSeq
        stHeader = rspHeader.Pack()

        nWrite = self.transport.write(stHeader + stBody)
        print ("    <<< AGT_SUBMIT_RSP")
        reactor.callLater(3.5, self.sendReportReq, rspHeader, submitRsp)
        reactor.callLater(5.5, self.sendReadReplyReq, rspHeader, submitRsp)

    def sendReportReq(self, rspHeader, submitRsp):
        print ("    --- sendReportReq. MsgKey[%s],H[%d],Rsp[%s]" % 
            ( submitRsp.szMsgKey
            , rspHeader.ulSeq
            , submitRsp.szQuerySessionKey))
        
        nMsgType = submitRsp.nMsgType
        szMsgKey = submitRsp.szMsgKey
        szQuerySessionKey = submitRsp.szQuerySessionKey

        ucVersion = rspHeader.ucVersion
        ulSeq = rspHeader.ulSeq

        reportReq = AGT_REPORT_REQ()
        reportReq.nMsgType = nMsgType
        reportReq.szMsgKey = szMsgKey
        reportReq.szQuerySessionKey = szQuerySessionKey
        reportReq.szSendDate = datetime.now().strftime('%Y%m%d%H%M%S')
        reportReq.nSendResult = 0
        reportReq.szErrCode = "0"
        reportReq.szErrText = "SUCCESS"
        reportReq.szReportID = "RPTID_0001"

        stBody = reportReq.Pack()

        lenBody = len(reportReq)

        reqHeader = AGT_MSG_HEADER()
        reqHeader.cFrame0 = 0xFE
        reqHeader.cFrame1 = 0xFE
        reqHeader.usLength = MAX_HEADER_SIZE + lenBody
        reqHeader.ucMsgType = int(AGT_MSG_TYPE.REQ.value)
        reqHeader.ucMsgName = int(AGT_MSG_NAME.REPORT.value)
        reqHeader.ucVersion = ucVersion
        reqHeader.ucReserverd = 0
        reqHeader.ulSeq = ulSeq
        stHeader = reqHeader.Pack()

        nWrite = self.transport.write(stHeader + stBody)
        print ("    <<< AGT_REPORT_REQ")

    def sendReadReplyReq(self, rspHeader, submitRsp):
        print ("    --- sendReadReplyReq. MsgKey[%s],H[%d],Rsp[%s]" % 
            ( submitRsp.szMsgKey
            , rspHeader.ulSeq
            , submitRsp.szQuerySessionKey))
        
        nMsgType = submitRsp.nMsgType
        szMsgKey = submitRsp.szMsgKey
        szQuerySessionKey = submitRsp.szQuerySessionKey

        ucVersion = rspHeader.ucVersion
        ulSeq = rspHeader.ulSeq

        readReplyReq = AGT_READREPLY_REQ()
        readReplyReq.nMsgType = nMsgType
        readReplyReq.szMsgKey = szMsgKey
        readReplyReq.szQuerySessionKey = szQuerySessionKey
        readReplyReq.szChkdDate = datetime.now().strftime('%Y%m%d%H%M%S')
        readReplyReq.nSendResult = 0
        readReplyReq.szErrCode = "0"
        readReplyReq.szErrText = "SUCCESS"
        readReplyReq.szReportID = "RPTID_0001"

        stBody = readReplyReq.Pack()

        lenBody = len(readReplyReq)

        reqHeader = AGT_MSG_HEADER()
        reqHeader.cFrame0 = 0xFE
        reqHeader.cFrame1 = 0xFE
        reqHeader.usLength = MAX_HEADER_SIZE + lenBody
        reqHeader.ucMsgType = int(AGT_MSG_TYPE.REQ.value)
        reqHeader.ucMsgName = int(AGT_MSG_NAME.READREPLY.value)
        reqHeader.ucVersion = ucVersion
        reqHeader.ucReserverd = 0
        reqHeader.ulSeq = ulSeq
        stHeader = reqHeader.Pack()

        nWrite = self.transport.write(stHeader + stBody)
        print ("    <<< AGT_READREPLY_REQ")

    def OnKeepAlive(self, reqHeader, body):
        recvKeepAlive = AGT_KEEP_ALIVE(body)
        sDecRate_SMS = recvKeepAlive.sDecRate_SMS
        sDecRate_LMS = recvKeepAlive.sDecRate_LMS
        print ("    KeepAlive.sDecRate_SMS[%d], sDecRate_LMS[%d]" % (sDecRate_SMS, sDecRate_LMS))

        sendKeepAlive = AGT_KEEP_ALIVE()
        sendKeepAlive.sDecRate_SMS = sDecRate_SMS
        sendKeepAlive.sDecRate_LMS = sDecRate_LMS

        stBody = sendKeepAlive.Pack()
        lenHeader = len(reqHeader)
        lenBody = len(sendKeepAlive)
        ucVersion = reqHeader.ucVersion
        ulSeq = reqHeader.ulSeq

        rspHeader = AGT_MSG_HEADER()
        rspHeader.cFrame0 = 0xFE
        rspHeader.cFrame1 = 0xFE
        rspHeader.usLength = lenHeader + lenBody
        rspHeader.ucMsgType = int(AGT_MSG_TYPE.KA.value)
        rspHeader.ucMsgName = int(AGT_MSG_NAME.KA.value)
        rspHeader.ucVersion = ucVersion
        rspHeader.ucReserverd = 0
        rspHeader.ulSeq = ulSeq
        stHeader = rspHeader.Pack()

        nWrite = self.transport.write(stHeader + stBody)
        print ("    <<< AGT_KEEP_ALIVE")

class MyFactory(ClientFactory):
    protocol = MrpClientProtocol
    
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

host = '0.0.0.0'
port = 4000
ports = 4443
if __name__ == '__main__':
    argc = len(sys.argv)
  
    print (sys.getdefaultencoding())

    agtMsgHeader = AGT_MSG_HEADER()
    print ('$ agtMsgHeader.len=%d' % (len(agtMsgHeader)))

    if argc >= 1 :
        myFactory = MyFactory(0)
        
        description = ('ssl:%d:interface=0.0.0.0:certKey=keys/server.crt:privateKey=keys/server.key' % (ports))
        tls_server = endpoints.serverFromString(reactor, description)
        tls_server.listen(myFactory)

        reactor.listenTCP(port, myFactory)
        reactor.run()
    else :
        print ('Usage: %s [scp_id]' % (sys.argv[0]))
        sys.exit(2)
