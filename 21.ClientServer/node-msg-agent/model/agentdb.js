'strict'

var log = require('log4js').getLogger("agentdb");
var config = require('../config');
const mariadb = require('mariadb');
const dbDefine = require('./agtDbDefine');

const pool = mariadb.createPool(
    {
        host: config.AGENT_DB.HOST, 
        port: config.AGENT_DB.PORT,
        user: config.AGENT_DB.USER, 
        password: config.AGENT_DB.PASSWORD, 
        database: config.AGENT_DB.DB_NAME, 
        charset: 'UTF8_UNICODE_CI',
        connectionLimit: 5
    });

var getMsg = function(callback) {
    var query = "";
    var nLimitMms = 10, nLimitSms = 10;

    log.debug(">>> START....getMsg()");
    query += "WITH ";
    query += "MMS_T AS ";
    query += "( ";
    query += "        SELECT ";
    query += "                @rownum_mms:=@rownum_mms+1 AS no, ";
    query += "                A.MSG_KEY                       , ";
    query += "                A.CALLEE_NO                     , ";
    query += "                A.CALLBACK_NO                   , ";
    query += "                A.CALLER_NO                     , ";
    query += "                A.SUBJECT                       , ";
    query += "                A.SMS_MSG                       , ";
    query += "                A.FILE_NAME                     , ";
    query += "                2     AS MSG_TYPE                   , ";
    query += "                'del'    ETC                        , ";
    query += "                A.ORDER_FLAG                        , ";
    query += "                A.SAVE_DT                           , ";
    query += "                A.RESERVATION_DT ";
    query += "                , A.READ_REPLY_FLAG ";
    query += "                , A.SEND_COUNT ";
    query += "        FROM ";
    query += "                TBL_SEND_MMS A , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "        WHERE ";
    query += "                ( ";
    query += "                        @rownum_mms:=0)=0 ";
    query += "        AND     A.PROC_STS                          = 0 ";
    query += "        AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s') ";
    query += "        AND     (( ";
    query += "                                DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "                        AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "                OR      A.ORDER_FLAG = 1)  ";
    query += "        ORDER BY ";
    query += "                ORDER_FLAG DESC ";
    query += "                    LIMIT " + nLimitMms + " ";
    query += ") ";
    query += ", ";
    query += "LMS_T AS ";
    query += "( ";
    query += "        SELECT ";
    query += "                @rownum_lms:=@rownum_lms+1 AS no, ";
    query += "                A.MSG_KEY                       , ";
    query += "                A.CALLEE_NO                     , ";
    query += "                A.CALLBACK_NO                   , ";
    query += "                A.CALLER_NO                   , ";
    query += "                A.SUBJECT                       , ";
    query += "                A.SMS_MSG                       , ";
    query += "                ''    FILE_NAME                    , ";
    query += "                1     AS MSG_TYPE                     , ";
    query += "                'del'    ETC                          , ";
    query += "                A.ORDER_FLAG                          , ";
    query += "                A.SAVE_DT                             , ";
    query += "                A.RESERVATION_DT ";
    query += "                , A.READ_REPLY_FLAG ";
    query += "                , A.SEND_COUNT ";
    query += "        FROM ";
    query += "                TBL_SEND_LMS A , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "        WHERE ";
    query += "                ( ";
    query += "                        @rownum_lms:=0)=0 ";
    query += "        AND     A.PROC_STS                          = 0 ";                           
    query += "        AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s')  ";
    query += "        AND     (( ";
    query += "                                DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "                        AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "                OR      A.ORDER_FLAG = 1)  ";
    query += "        ORDER BY ";
    query += "                ORDER_FLAG DESC ";
    query += "                    LIMIT " + nLimitMms + " ";
    query += ") ";
    query += ", ";
    query += "SMS_T AS ";
    query += "( ";
    query += "        SELECT ";
    query += "                @rownum_sms:=@rownum_sms+1 AS no, ";
    query += "                A.MSG_KEY                       , ";
    query += "                A.CALLEE_NO                     , ";
    query += "                A.CALLBACK_NO                   , ";
    query += "                A.CALLER_NO                     , ";
    query += "                '' SUBJECT                      , ";
    query += "                A.SMS_MSG                       , ";
    query += "                ''    FILE_NAME                    , ";
    query += "                0     AS MSG_TYPE                     , ";
    query += "                'del'    ETC                          , ";
    query += "                A.ORDER_FLAG                          , ";
    query += "                A.SAVE_DT                             , ";
    query += "                A.RESERVATION_DT ";
    query += "                , A.READ_REPLY_FLAG ";
    query += "                , A.SEND_COUNT ";
    query += "        FROM ";
    query += "                TBL_SEND_SMS A , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "                ( ";
    query += "                        SELECT ";
    query += "                                IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "                        FROM ";
    query += "                                TBL_CF_AGT_CODE ";
    query += "                        WHERE ";
    query += "                                CODE_CLASS = 'AGT_CONFIG' ";
    query += "                        AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "        WHERE ";
    query += "                ( ";
    query += "                        @rownum_sms:=0)=0 ";
    query += "        AND     A.PROC_STS                          = 0 ";                           
    query += "        AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s') ";
    query += "        AND     (( ";
    query += "                                DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "                        AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "                OR      A.ORDER_FLAG = 1)  ";
    query += "        ORDER BY ";
    query += "                ORDER_FLAG DESC  ";
    query += "                    LIMIT " + nLimitSms + " ";
    query += ") ";
    query += ", ";
    query += "SUM_T AS ";
    query += "( ";
    query += "        SELECT ";
    query += "                no          , ";
    query += "                MSG_KEY     , ";
    query += "                CALLEE_NO   , ";
    query += "                CALLBACK_NO , ";
    query += "                CALLER_NO   , ";
    query += "                SUBJECT     , ";
    query += "                SMS_MSG     , ";
    query += "                FILE_NAME   , ";
    query += "                MSG_TYPE  ";
    query += "                , ORDER_FLAG ";
    query += "                , READ_REPLY_FLAG  ";
    query += "                , SEND_COUNT ";
    query += "        FROM ";
    query += "                MMS_T ";
    query += "        UNION ALL ";
    query += "        SELECT ";
    query += "                no          , ";
    query += "                MSG_KEY     , ";
    query += "                CALLEE_NO   , ";
    query += "                CALLBACK_NO , ";
    query += "                CALLER_NO   , ";
    query += "                SUBJECT     , ";
    query += "                SMS_MSG     , ";
    query += "                FILE_NAME   , ";
    query += "                MSG_TYPE ";
    query += "                , ORDER_FLAG ";
    query += "                , READ_REPLY_FLAG  ";
    query += "                 , SEND_COUNT ";
    query += "        FROM ";
    query += "                LMS_T ";
    query += ") ";
    query += " , SUM_MMS_T AS ( ";
    query += "    SELECT ";
    query += "        no,  ";
    query += "        MSG_KEY     , ";
    query += "        CALLEE_NO   , ";
    query += "        CALLBACK_NO , ";
    query += "        CALLER_NO   , ";
    query += "        SUBJECT     , ";
    query += "        SMS_MSG     , ";
    query += "        FILE_NAME   , ";
    query += "        MSG_TYPE ";
    query += "        , ORDER_FLAG ";
    query += "        , READ_REPLY_FLAG  ";
    query += "         , SEND_COUNT ";
    query += "    FROM ";
    query += "        SUM_T  ";
    query += "            LIMIT " + nLimitMms + " ";
    query += ") ";
    query += "SELECT ";
    query += "        no, ";
    query += "        MSG_KEY     , ";
    query += "        CALLEE_NO   , ";
    query += "        CALLBACK_NO , ";
    query += "        CALLER_NO   , ";
    query += "        SUBJECT     , ";
    query += "        SMS_MSG     , ";
    query += "        FILE_NAME   , ";
    query += "        MSG_TYPE ";
    query += "        , ORDER_FLAG ";
    query += "        , READ_REPLY_FLAG  ";
    query += "        , SEND_COUNT ";
    query += "FROM ";
    query += "        SUM_MMS_T ";
    query += "UNION ALL   ";
    query += "    SELECT ";
    query += "            no          , ";
    query += "            MSG_KEY     , ";
    query += "            CALLEE_NO   , ";
    query += "            CALLBACK_NO , ";
    query += "            CALLER_NO   , ";
    query += "            SUBJECT     , ";
    query += "            SMS_MSG     , ";
    query += "            FILE_NAME   , ";
    query += "            MSG_TYPE ";
    query += "            , ORDER_FLAG ";
    query += "            , READ_REPLY_FLAG  ";
    query += "            , SEND_COUNT ";
    query += "    FROM ";
    query += "            SMS_T ";
    query += "ORDER BY no";

    pool.getConnection()
        .then(conn => {
            log.debug("getMsg.query=", query);
            conn.query(query)
                .then((rows) => {
                    log.debug("getMsg.rows=", rows.length); //[ {val: 1}, meta: ... ]
                    conn.end(); //release to pool
                    if(rows.length > 0) {
                        var resultMap = new Array();
                        
                        for(var i=0; i<rows.length; i++) {
                            resultMap.push(rows[i]);
                        }
                        updateMsgProcSts(resultMap, dbDefine.procSts.LOAD, function(err, result) {
                            if(!err) {
                                log.debug(">>> getMsg.updateMsgProcSts=", result);
                            }
                            else {
                                log.info(">>> getMsg.updateMsgProcSts : err: ", err)
                            }
                        });    // PROC_STS=1 로 업데이트
                        
                        callback(null, resultMap);
                    }
                    else {
                        callback(null, rows);
                    }
                })
            .catch(err => {
                //handle error
                conn.end(); //release to pool
                callback(err);
            })
        }).catch(err => {
            //not connected
            log.error(err);
            callback(err);
        });
    log.debug(">>> END....getMsg()");
}

var getMsgCnt = function(callback) {
    var query = "";

    log.debug(">>> START....getMsgCnt()");
    query += "WITH ";
    query += "	        MMS_T AS ";
    query += "	        ( ";
    query += "	                SELECT ";
    query += "	                        @rownum_mms:=@rownum_mms+1 AS no   ";
    query += "	                FROM ";
    query += "	                        TBL_SEND_MMS A , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "	                WHERE ";
    query += "	                        ( ";
    query += "	                                @rownum_mms:=0)=0 ";
    query += "	                AND     A.PROC_STS                          = 0                                  ";
    query += "	                AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s')  ";
    query += "	                AND     (( ";
    query += "	                                        DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "	                                AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "	                        OR      A.ORDER_FLAG = 1)  ";
    query += "	        ) ";
    query += "	        , ";
    query += "	        LMS_T AS ";
    query += "	        ( ";
    query += "	                SELECT ";
    query += "	                        @rownum_lms:=@rownum_lms+1 AS no             ";
    query += "	                FROM ";
    query += "	                        TBL_SEND_LMS A , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "	                WHERE ";
    query += "	                        ( ";
    query += "	                                @rownum_lms:=0)=0 ";
    query += "	                AND     A.PROC_STS                          = 0                                  ";
    query += "	                AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s')  ";
    query += "	                AND     (( ";
    query += "	                                        DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "	                                AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "	                        OR      A.ORDER_FLAG = 1)  ";
    query += "	        ) ";
    query += "	        , ";
    query += "	        SMS_T AS ";
    query += "	        ( ";
    query += "	                SELECT ";
    query += "	                        @rownum_sms:=@rownum_sms+1 AS no ";
    query += "	                FROM ";
    query += "	                        TBL_SEND_SMS A , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'00:00:00') S_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_START_TIME' ) START_T , ";
    query += "	                        ( ";
    query += "	                                SELECT ";
    query += "	                                        IFNULL(CODE_VALUE,'24:00:00') E_DT ";
    query += "	                                FROM ";
    query += "	                                        TBL_CF_AGT_CODE ";
    query += "	                                WHERE ";
    query += "	                                        CODE_CLASS = 'AGT_CONFIG' ";
    query += "	                                AND     CODE_ID    = 'SEND_END_TIME' ) END_T ";
    query += "	                WHERE ";
    query += "	                        ( ";
    query += "	                                @rownum_sms:=0)=0 ";
    query += "	                AND     A.PROC_STS                          = 0                                  ";
    query += "	                AND     IFNULL(A.RESERVATION_DT,A.SAVE_DT) <= DATE_FORMAT(now(),'%Y%m%d%H%i%s')  ";
    query += "	                AND     (( ";
    query += "	                                        DATE_FORMAT(now(),'%H:%i:%s') >= START_T.S_DT ";
    query += "	                                AND     DATE_FORMAT(now(),'%H:%i:%s') <= END_T.E_DT) ";
    query += "	                        OR      A.ORDER_FLAG = 1)  ";
    query += "	        ) ";
    query += "	        , ";
    query += "	        SUM_T AS ";
    query += "	        ( ";
    query += "	                SELECT ";
    query += "	                    * ";
    query += "	                FROM ";
    query += "	                        MMS_T ";
    query += "	                 ";
    query += "	                UNION ALL ";
    query += "	                 ";
    query += "	                SELECT ";
    query += "	                     * ";
    query += "	                FROM ";
    query += "	                        LMS_T ";
    query += "	                 ";
    query += "	                UNION ALL ";
    query += "	                 ";
    query += "	                SELECT ";
    query += "	                  * ";
    query += "	                FROM ";
    query += "	                        SMS_T ";
    query += "	        )  ";
    query += "			SELECT count(*) AS MSG_CNT ";
    query += "			FROM ";
    query += "			        SUM_T ";

    pool.getConnection()
        .then(conn => {
            log.debug("getMsgCnt.query=", query);
            conn.query(query)
                .then((rows) => {
                    log.debug("getMsgCnt.MSG_CNT=", rows[0]['MSG_CNT']); //[ {val: 1}, meta: ... ]
                    conn.end(); //release to pool
                    callback(null, rows[0]['MSG_CNT']);
                })
            .catch(err => {
                //handle error
                conn.end(); //release to pool
                callback(err);
            })
        }).catch(err => {
            //not connected
            log.error(err);
            callback(err);
        });
    log.debug(">>> END....getMsgCnt()");
}

var updateMsgProcSts = function(arrMsg, varProcSts, callback) {
    var query = "";

    log.debug(">>> START....updateMsgProcSts(", arrMsg.length, ", " + varProcSts, ")");
    query += "UPDATE TBL_SEND_SMS SET ";
    query += "PROC_STS = " + varProcSts + " ";
    query += "WHERE 1=1 ";
    query += "AND MSG_KEY IN "
    query += "("
    for(var i=0; i<arrMsg.length; i++) {
        if (i > 0) {
            query += " , ";
        }
        query += arrMsg[i].MSG_KEY;
    }
    query += ")"

    pool.getConnection()
        .then(conn => {
            log.debug("updateMsgProcSts.query=", query);
            conn.query(query)
                .then((res) => {
                    log.debug("updateMsgProcSts.res=", res);
                    conn.end(); //release to pool
                    callback(null, res.affectedRows);
                })
            .catch(err => {
                //handle error
                conn.end(); //release to pool
                callback(err);
            })
        }).catch(err => {
            //not connected
            log.error(err);
            callback(err);
        });
    log.debug(">>> END....updateMsgProcSts(", arrMsg.length, ", " + varProcSts, ")");
}

var updateTblSendSms = function(item, callback) {
    var query = "";

    log.debug(">>> START....updateTblSendSms(", item.length, ")");
    query += "UPDATE TBL_SEND_SMS SET ";
    query += " PROC_STS = " + item.PROC_STS;
    if(item.TRANSACTIONID != undefined && item.TRANSACTIONID.length > 0) {
        query += ", TRANSACTIONID='" + item.TRANSACTIONID + "'";
    }
    if(item.QUERYSESSIONKEY != undefined && item.QUERYSESSIONKEY.length > 0) {
        query += ", QUERYSESSIONKEY='" + item.QUERYSESSIONKEY + "'";
    }
    if(item.PROC_RESULT != undefined && item.PROC_RESULT.length > 0) {
        query += ", PROC_RESULT='" + item.PROC_RESULT + "'";
    }
    if(item.RESULT_MSG != undefined && item.RESULT_MSG.length > 0) {
        query += ", RESULT_MSG='" + item.RESULT_MSG + "'";
    }
    if(item.ERROR_CODE != undefined && item.ERROR_CODE.length > 0) {
        query += ", ERROR_CODE='" + item.ERROR_CODE + "'";
    }
    if(item.ERROR_DESCRIPTION != undefined && item.ERROR_DESCRIPTION.length > 0) {
        query += ", ERROR_DESCRIPTION='" + item.ERROR_DESCRIPTION + "'";
    }
    if(item.REPORT_DT != undefined && item.REPORT_DT.length > 0) {
        query += ", REPORT_DT=" + item.REPORT_DT;
    }
    if(item.DELIVERY_DT != undefined && item.DELIVERY_DT.length > 0) {
        query += ", DELIVERY_DT=" + item.DELIVERY_DT;
    }
    if(item.READ_REPLY_DT != undefined && item.READ_REPLY_DT.length > 0) {
        query += ", READ_REPLY_DT=" + item.READ_REPLY_DT;
    }
    if(item.WORKER_DT != undefined && item.WORKER_DT.length > 0) {
        query += ", WORKER_DT=" + item.WORKER_DT;
    }
    if(item.SEND_COUNT != undefined && item.SEND_COUNT.length > 0) {
        query += ", SEND_COUNT=" + item.SEND_COUNT;
    }
    query += " WHERE 1=1 ";
    if(item.MSG_KEY != undefined && item.MSG_KEY.length > 0) {
        query += " AND MSG_KEY = CAST(" + item.MSG_KEY + " AS UNSIGNED)";
    }
    if(item.MSG_ID != undefined && item.MSG_ID.length > 0) {
        query += " AND QUERYSESSIONKEY='" + item.MSG_ID + "'";
    }
    if(item.PROC_STS != undefined && item.PROC_STS == dbDefine.procSts.SUBMIT) {
        query += " AND PROC_STS=" + dbDefine.procSts.LOAD;
    }

    pool.getConnection()
        .then(conn => {
            log.debug("updateTblSendSms.query=", query);
            conn.query(query)
                .then((res) => {
                    log.debug("updateTblSendSms.res=", res);
                    conn.end(); //release to pool
                    callback(null, res.affectedRows);
                })
            .catch(err => {
                //handle error
                conn.end(); //release to pool
                callback(err);
            })
        }).catch(err => {
            //not connected
            log.error(err);
            callback(err);
        });
    log.debug(">>> END....updateTblSendSms(", item.length, ")");
}

module.exports = {
    getMsg,
    getMsgCnt,
    updateMsgProcSts,
    updateTblSendSms,
}