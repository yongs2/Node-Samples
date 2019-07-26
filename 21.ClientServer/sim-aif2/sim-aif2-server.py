#!/usr/local/bin/python3
# -*- coding:utf-8 -*-
# python 3.7.3
#
# sim-AIF
#

import json
import sys
from datetime import datetime

from twisted.internet import endpoints, reactor, ssl
from TextClientProtocol import TextClientProtocol, MyFactory

class AifClientProtocol(TextClientProtocol) :
    def __init__(self):
        super(AifClientProtocol, self).__init__()
        print ('AIF.__init__')

    def OnData(self, body) :
        #print ("AIF.Body:", body)
        body = body.replace("'", "\"")
        parser = json.loads(body)
        keys = list(parser.keys())
        if len(keys) != 2 :
            print('AIF.HandleMessage, keys=[%s]' % (keys))
        else :
            print (">> RECV : ", parser['head']['MsgName'], ", Seq=", parser['head']['Seq'], ", Ret=", parser['head']['Ret'])
            szMsgName = parser['head']['MsgName']
            if szMsgName == "TEST_REQ" :
                self.OnTestReq(parser)
            elif szMsgName == "KEEP_ALIVE" :
                self.OnKeepAlive(parser)
            elif szMsgName == "BIND_REQ" :
                self.OnBindReq(parser)
            elif szMsgName == "UNBIND_REQ" :
                self.OnUnbindReq(parser)
            elif szMsgName == "SUBMIT_REQ" :
                self.OnSubmitReq(parser)
            elif szMsgName == "REPORT_RSP" :
                self.OnReportRsp(parser)
            elif szMsgName == "READREPLY_RSP" :
                self.OnReadReplyRsp(parser)
            else :
                print ("   UNDEFINED:", szMsgName)

    def MsgHeadBody(self, szMsgName, seq) :
        msg = {}
        msg['head'] = {}
        msg['head']['MsgName'] = szMsgName
        msg['head']['Seq'] = seq
        msg['head']['Ret'] = 0
        msg['head']['Version'] = "1.0.0"
        msg['body'] = {}
        return msg

    def OnTestReq(self, parser):
        print (">> OnTestReq : ", parser['body']['DATA'])

    def OnKeepAlive(self, parser):
        print (">> OnKeepAlive : ", parser['body']['sDecRate_SMS'], parser['body']['sDecRate_LMS'])
        req_seq = parser['head']['Seq']

        KeepAliveRsp = self.MsgHeadBody("KEEP_ALIVE", req_seq)
        KeepAliveRsp['body']['sDecRate_SMS'] = parser['body']['sDecRate_SMS']
        KeepAliveRsp['body']['sDecRate_LMS'] = parser['body']['sDecRate_LMS']

        self.writeJson(KeepAliveRsp)

    def OnBindReq(self, parser) :
        print (">> OnBindReq : ", parser['body']['szLoginId'], parser['body']['szToken'])
        req_seq = parser['head']['Seq']

        BindRsp = self.MsgHeadBody("BIND_RSP", req_seq)
        BindRsp['body']['nResult'] = 0
        BindRsp['body']['sMaxTPS_SMS'] = 0
        BindRsp['body']['sMaxTPS_LMS'] = 0

        self.writeJson(BindRsp)

    def OnUnbindReq(self, parser) :
        print (">> OnUnbindReq : ", parser['body']['szLoginId'])
        req_seq = parser['head']['Seq']

        UnbindRsp = self.MsgHeadBody("UNBIND_RSP", req_seq)
        UnbindRsp['body']['nResult'] = 0

        self.writeJson(UnbindRsp)

    def OnSubmitReq(self, parser) :
        print (">> OnSubmitReq : ", parser['body']['nMsgType'], parser['body']['szMsgKey'])
        nMsgType = parser['body']['nMsgType']
        szMsgKey = parser['body']['szMsgKey'].strip('\x00')
        szCaller = parser['body']['szCaller'].strip('\x00')
        szCallee = parser['body']['szCallee'].strip('\x00')
        szCallBack = parser['body']['szCallBack'].strip('\x00')
        szSubject = parser['body']['szSubject'].strip('\x00')
        szMessage = parser['body']['szMessage'].strip('\x00')
        szFileName = parser['body']['szFileName'].strip('\x00')
        print ("    Msg[%d,%s] Caller=[%s] Callee=[%s] CallBack=[%s] Subject[%s] Message[%s] FileName[%s]" % (
            nMsgType, szMsgKey, szCaller, szCallee, szCallBack, szSubject, szMessage, szFileName) )

        req_seq = parser['head']['Seq']

        SubmitRsp = self.MsgHeadBody("SUBMIT_RSP", req_seq)
        SubmitRsp['body']['nResult'] = 0
        SubmitRsp['body']['nMsgType'] = nMsgType
        SubmitRsp['body']['szMsgKey'] = szMsgKey
        SubmitRsp['body']['szQuerySessionKey'] = ("SYSTEM_CREATE_KEY_%05d" % (req_seq))
        SubmitRsp['body']['szErrCode'] = "0"
        SubmitRsp['body']['szErrText'] = "SUCCESS"

        self.writeJson(SubmitRsp)

        reactor.callLater(3.5, self.sendReportReq, SubmitRsp)
        reactor.callLater(5.5, self.sendReadReplyReq, SubmitRsp)

    def OnReportRsp(self, parser) :
        print (">> OnReportRsp : ", parser['body']['nResult'], parser['body']['nMsgType'], parser['body']['szMsgKey'], parser['body']['szQuerySessionKey'], parser['body']['szReportID'])

    def sendReportReq(self, SubmitRsp) :
        print (">> sendReportReq : ", SubmitRsp['body']['szMsgKey'], SubmitRsp['body']['szQuerySessionKey'])
        rsp_seq = SubmitRsp['head']['Seq']

        ReportReq = self.MsgHeadBody("REPORT_REQ", rsp_seq)
        ReportReq['body']['nResult'] = 0
        ReportReq['body']['nMsgType'] = SubmitRsp['body']['nMsgType']
        ReportReq['body']['szMsgKey'] = SubmitRsp['body']['szMsgKey']
        ReportReq['body']['szQuerySessionKey'] = SubmitRsp['body']['szQuerySessionKey']
        ReportReq['body']['szErrCode'] = "0"
        ReportReq['body']['szErrText'] = "SUCCESS"
        ReportReq['body']['szReportID'] = ("RPTID_%05d" % (rsp_seq))

        self.writeJson(ReportReq)

    def OnReadReplyRsp(self, parser) :
        print (">> OnReadReplyRsp : ", parser['body']['nResult'], parser['body']['nMsgType'], parser['body']['szMsgKey'], parser['body']['szQuerySessionKey'], parser['body']['szReportID'])

    def sendReadReplyReq(self, SubmitRsp) :
        print (">> sendReadReplyReq : ", SubmitRsp['body']['szMsgKey'], SubmitRsp['body']['szQuerySessionKey'])
        rsp_seq = SubmitRsp['head']['Seq']

        ReadReplyReq = self.MsgHeadBody("READREPLY_REQ", rsp_seq)
        ReadReplyReq['body']['nResult'] = 0
        ReadReplyReq['body']['nMsgType'] = SubmitRsp['body']['nMsgType']
        ReadReplyReq['body']['szMsgKey'] = SubmitRsp['body']['szMsgKey']
        ReadReplyReq['body']['szQuerySessionKey'] = SubmitRsp['body']['szQuerySessionKey']
        ReadReplyReq['body']['szChkdDate'] = datetime.now().strftime('%Y%m%d%H%M%S')
        ReadReplyReq['body']['nSendResult'] = 0
        ReadReplyReq['body']['szErrCode'] = "0"
        ReadReplyReq['body']['szErrText'] = "SUCCESS"
        ReadReplyReq['body']['szReportID'] = ("RPTID_%05d" % (rsp_seq))

        self.writeJson(ReadReplyReq)

host = '0.0.0.0'
port = 4000
ports = 4443
if __name__ == '__main__':
    argc = len(sys.argv)
  
    print (sys.getdefaultencoding())

    if argc >= 1 :
        myFactory = MyFactory(0)
        myFactory.protocol = AifClientProtocol
        description = ('ssl:%d:interface=0.0.0.0:certKey=keys/server.crt:privateKey=keys/server.key' % (ports))
        tls_server = endpoints.serverFromString(reactor, description)
        tls_server.listen(myFactory)

        reactor.listenTCP(port, myFactory)
        reactor.run()
    else :
        print ('Usage: %s [id]' % (sys.argv[0]))
        sys.exit(2)