'use strict';

var log = require('log4js').getLogger("MultiAnnounce");
var pool = require('./dbConnect');
const async = require('async');

class MultiAnnounce {

}

MultiAnnounce.getMultiAnnounceList = function(reqQuery, cb) {
    var query = "";
    
    query += "SELECT TO_CHAR(TO_DATE(B.STD_TIME, 'yyyymmddhh24miss') \
    , 'yyyy-MM-dd HH24:Mi:ss') STD_TIME \
    , A.ID USER_ID \
    , A.NAME USER_NAME \
    , TEL_NUM(B.ANI) ANI \
    , TEL_NUM(B.ANN_NUMBER) ANN_NUMBER \
    , B.ANN_NAME \
    , B.ANN_ADDRS \
    , CAST(B.SVC_TYPE AS VARCHAR(10)) AS SVC_TYPE \
    FROM INS.TBL_CF_USER A \
    LEFT JOIN INS.TBL_HIST_MULANN B \
    ON (A.ID = B.USER_ID) \
    WHERE TO_DATE(B.STD_TIME, 'YYYYMMDDHH24MISS') ";
    query += " BETWEEN TO_DATE(" + reqQuery.START_DATE + ",'YYYYMMDDHH24MISS')";
    query += " AND TO_DATE(" + reqQuery.END_DATE + ", 'YYYYMMDDHH24MISS')";
    if((reqQuery.USER_ID != undefined) && (reqQuery.USER_ID.length > 0)) {
        query += " AND B.USER_ID = '" + reqQuery.USER_ID + "'";
    }
    if((reqQuery.ANI != undefined) && (reqQuery.ANI.length > 0)) {
        query += " AND replace(B.ANI,'-','') = replace('" + reqQuery.ANI + "','-','')";
    }
    if((reqQuery.ANN_NAME != undefined) && (reqQuery.ANN_NAME.length > 0)) {
        query += " AND B.ANN_NAME = '" + reqQuery.ANN_NAME + "'";
    }
    if((reqQuery.ANN_NUMBER != undefined) && (reqQuery.ANN_NUMBER.length > 0)) {
        query += " AND replace(B.ANN_NUMBER,'-','') = replace('" + reqQuery.ANN_NUMBER + "','-','')";
    }
    query += " ORDER BY B.STD_TIME DESC, B.ANI ASC";

    log.debug(">>> getMultiAnnounceList : " + query);
    pool.insDb(function(err, insDb) {
        pool.query(insDb, query, function(err, results) {
            if ( err ) {
                return cb(err);
            }
            log.debug(">>> getMultiAnnounceList.results : ", results);
            return cb(null, results);
        });
    });
}

MultiAnnounce.insertMultiAnnounceList = function(reqBody, cb) {
    var query = "";

    log.debug(">>> insertMultiAnnounceList : reqBody : ", typeof(reqBody), ", Con=", reqBody.constructor, ", Len=", reqBody.length);

    var asyncIdx =0, resultIdx = 0;
    pool.insDb(function(err, insDb) {
        async.eachSeries(reqBody, (item, next) => { // item은 reqBody array 의 객체 1개씩 담긴다
            log.info('>>> insertMultiAnnounceList : Task Start : ', asyncIdx++);
            query = "";
            query += "INSERT INTO INS.TBL_HIST_MULANN \
                (USER_ID, STD_TIME, SVC_TYPE, ANI, ANN_NUMBER \
                , ANN_NAME, ANN_ADDRS, ANI_OPER, ANI_NAME, UNIQ_ID \
                , SEQ_NO) \
                VALUES ";
            query += "( '" + item.USER_ID + "'";
            query += ", TO_CHAR(SYSDATE, 'yyyymmddhh24miss')";
            query += ", '" + item.SVC_TYPE + "'";
            query += ", '" + item.ANI + "'";
            query += ", '" + item.ANN_NUMBER + "'";
            query += ", '" + item.ANN_NAME + "'";
            query += ", '" + item.ANN_ADDRS + "'";
            query += ", '" + item.ANI_OPER + "'";
            query += ", '" + item.ANI_NAME + "'";
            query += ", '" + item.UNIQ_ID + "'";
            query += ", '" + item.SEQ_NO + "'";
            query += ") ; ";
            pool.update(insDb, query, function(err, results) {
                if ( err ) {
                    log.info('Task FAIL : ', query, ", err=", err.message);
                }
                else {
                    log.debug('Task done : ', query, ", resultIdx=", resultIdx);
                    resultIdx += 1; // INSERT 성공 카운터
                }
                next(null, item);   // INSERT 성공/실패 여부에 상관없이 reqBody의 다음 array 객체를 넘김
            });
        }, (error, results) => {
            if ( error ) {
                log.error('Error : ', error.message);
                return cb(err);;
            }
            log.info('async.eachSeries Done : ', results, ", asyncIdx=", asyncIdx, ", resultIdx=", resultIdx);
            results = resultIdx;
            return cb(null, results);
        });
    });
}

module.exports = MultiAnnounce;
