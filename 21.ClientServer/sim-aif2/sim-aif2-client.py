#!/usr/local/bin/python3
# -*- coding:utf-8 -*-
# python 3.7.3
#
# sim-AIF
#

import socket
import json
import struct
import threading
from time import sleep

MAX_HEADER_SIZE=16

class AifConnection:
    msg_test = """ 
    {
        "head" : {
            "MsgName": "TEST_REQ", 
            "Seq": 0,
            "Ret": 0,
            "Version": "1.0.0"
        },
        "body" : {
            "DATA" : "test msg"
        }
    } 
    """ 
    ENCODE_STR = "utf-8"

    #sends JSON text command in format "4 bytes length + message"
    def send_msg(self, body):
        #json.loads was added only for validation of the outgoing JSON message
        json.loads(body)
        header = "FEFE" + ("%012d" % len(body))
        msg = header + body
        print (">>> send_msg: ", msg)
        self.sock.send(msg.encode())
            
    #receives "length" number of bytes from socket, blocks until required number of bytes was received
    def recv_bytes(self, length):
        recv_length = 0
        res = ''
        while recv_length < length:
            res = res + self.sock.recv(length - recv_length).decode(self.ENCODE_STR)
            recv_length = len(res)
        return res
    
    #procedure that runs in a separate thread and reads messages from the socket
    def recv_proc(self):
        #receive api pass phrase
        while True:
            header = self.recv_bytes(MAX_HEADER_SIZE)
            if header[0:4] == "FEFE" :
                length = int(header[4:MAX_HEADER_SIZE])
                if 0 != length:
                    msg = self.recv_bytes(length)
                    self.handleMessage(msg)
        return

    def handleMessage(self, msg):
        print("RECV:", msg)

    def connect(self, ip, port):
        #create TCP socket and connect to the MediaProcessor
        self.sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        server_address = (ip, port)
        self.sock.connect(server_address)
        #create socket reading thread
        self.thr = threading.Thread(target=self.recv_proc, args = ())
        self.thr.daemon = True
        self.thr.start()

    def shutdown(self):
        self.sock.shutdown(socket.SHUT_RDWR)

    def close(self) :
        self.sock.close();

if __name__ == '__main__':
    aif_client = AifConnection()
    aif_client.connect("127.0.0.1", 4000)

    strBindReq = """{"head":{"MsgName":"BIND_REQ","Seq":1,"Ret":0,"Version":"1.0.0"},"body":{"szLoginId":"LOGIN_ID", "szToken":"TOKEN", "cRvSMS_F":0, "cRvMMS_F" : 0, "cEnc_F" : 0 }}"""
    aif_client.send_msg(strBindReq)
    sleep(2)    # wait BindRsp

    strKeepAliveReq = """{"head":{"MsgName":"KEEP_ALIVE","Seq":1,"Ret":0,"Version":"1.0.0"},"body":{"sDecRate_SMS":10, "sDecRate_LMS":10 } }"""
    aif_client.send_msg(strKeepAliveReq)
    sleep(2)    # wait KeepAlive

    strSubmitReq = """{
        "head":{"MsgName":"SUBMIT_REQ","Seq":1,"Ret":0,"Version":"1.0.0"},
        "body":{
            "nMsgType": 0, 
            "szMsgKey": "MsgKey00001", 
            "szCaller": "Caller00001", 
            "szCallee": "Callee00001",
            "szCallBack": "Callback00001",
            "nPriority" : 0,
            "szCntUpDate" : "20190101",
            "nReadReply" : 0,
            "szSubject" : "Subject0001",
            "szMessage" : "Message0001",
            "szFileName" : "FileName0001"
        }}"""
    aif_client.send_msg(strSubmitReq)
    sleep(2)    # wait SubmitRsp

    sleep(4)    # wait ReportReq

    sleep(4)    # wait ReadRplyReq

    strUnbindReq = """{"head":{"MsgName":"UNBIND_REQ","Seq":1,"Ret":0,"Version":"1.0.0"},"body":{"szLoginId":"LOGIN_ID"} }"""
    aif_client.send_msg(strUnbindReq)
    sleep(2)    # wait UnbindRsp
    aif_client.shutdown();
    aif_client.close();
