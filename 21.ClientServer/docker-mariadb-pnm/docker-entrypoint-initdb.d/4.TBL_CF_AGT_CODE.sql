use AGENT_DB;

LOCK TABLES `TBL_CF_AGT_CODE` WRITE;
INSERT INTO `TBL_CF_AGT_CODE` 
VALUES 
  (
    'AGT_CONFIG', 'CONN_ID', '접속 ID', 
    'AII1440060724CJFYQZ', 5
  ), 
  (
    'AGT_CONFIG', 'CONN_PWD', '접속 PWD', 
    'TBK1440060724BGGQTZ', 6
  ), 
  (
    'AGT_CONFIG', 'DEL_HIST_LMS', 'LMS 이력 삭제시간(0:무한, other:일수)', 
    '0', 13
  ), 
  (
    'AGT_CONFIG', 'DEL_HIST_MMS', 'MMS 이력 삭제시간(0:무한, other:일수)', 
    '1', 13
  ), 
  (
    'AGT_CONFIG', 'DEL_HIST_SMS', 'SMS 이력 삭제시간(0:무한, other:일수)', 
    '1', 13
  ), 
  (
    'AGT_CONFIG', 'LOAD_TIMEOUT', 'Loading timeout 기준시간(HH24:MI)', 
    '00:30', 10
  ), 
  (
    'AGT_CONFIG', 'REPORT_TIMEOUT', 'report timeout 기준시간(HH24:MI)', 
    '00:30', 10
  ), 
  (
    'AGT_CONFIG', 'REPORT_URL', 'report 수신 URL', 
    'http://192.168.0.169:9090/report', 
    4
  ), 
  (
    'AGT_CONFIG', 'SEND_END_TIME', '전송 종료시간(HH24:MI:SS)', 
    '21:00:00', 10
  ), 
  (
    'AGT_CONFIG', 'SEND_START_TIME', 
    '전송 시작시간(HH24:MI:SS)', 
    '09:00:00', 9
  ), 
  (
    'AGT_CONFIG', 'SEND_TPS', '초당 최대 전송 속도 TPS', 
    '100', 8
  ), 
  (
    'AGT_CONFIG', 'TARGET_ADDR', '접속 Address(Option)', 
    '192.168.0.230', 1
  ), 
  (
    'AGT_CONFIG', 'TARGET_PORT', '접속 Port(Option)', 
    '8443', 2
  ), 
  (
    'AGT_CONFIG', 'TARGET_URL', '접속 UTL', 
    'https://192.168.0.230:8443/MESG', 
    3
  ), 
  (
    'AGT_CONFIG', 'VASID_INFO', 'VAS 정보', 
    'shub', 7
  ), 
  (
    'MASTER', 'AGT_CONFIG', 'Agent 설정정보', 
    NULL, 1
  ), 
  (
    'MASTER', 'RETRY_ERR_CODE', '재전송 오류 Code', 
    NULL, 1
  ), 
  (
    'RETRY_ERR_CODE', 'AIF0002', 'Memory Alloc Fail', 
    'AIF0002', 1
  ), 
  (
    'RETRY_ERR_CODE', 'AIF0003', 'Internal Transmit Error', 
    'AIF0003', 2
  ), 
  (
    'RETRY_ERR_CODE', 'AIF0004', 'Internal MDB Fail', 
    'AIF0004', 3
  ), 
  (
    'RETRY_ERR_CODE', 'AIF0006', 'Permit TPS Over', 
    'AIF0006', 4
  );

UNLOCK TABLES;