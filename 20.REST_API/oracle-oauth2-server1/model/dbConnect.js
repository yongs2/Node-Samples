'use strict';

var log = require('log4js').getLogger("dbConnection");
var JDBC = require('jdbc');
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
    jinst.addOption("-Xrs");
    jinst.setupClasspath(['./drivers/ojdbc14.jar']);
}

var oauthDb = new JDBC({
    url         : process.env.DB_URL || 'jdbc:oracle:thin:@192.168.0.208:1521:ORCL',
    drivername  : 'oracle.jdbc.driver.OracleDriver',
    minpoolsize : process.env.DB_MINPOOL || 1,
    maxpoolsize : process.env.DB_MAXPOOL || 10,

    user        : process.env.DB_USER || 'user',
    password    : process.env.DB_PASS || 'password'
});

var oauthDbInit = false;

function reserve(db, callback) {
    log.info('reserve.connectioned');
    db.reserve(function(err, connobj) {
        if (err) {
            return callback(err);
        } 
        else {
            log.info("reserve.Using connection: " + connobj.uuid);
            return callback(null, connobj, connobj.conn);
        }
    });
}

function release(db, connobj, err, result, callback) {
    db.release(connobj, function(e) {
        if (err) {
            return callback(err);
        } 
        else {
            return callback(null, result);
        }
    });
}

exports.oauthDb = function(callback) {
    if (!oauthDbInit) {
        oauthDb.initialize(function(err) {
            if (err) {
                return callback(err);
            } 
            else {
                oauthDbInit = true;
                log.info("Success to connect DB");
                return callback(null, oauthDb);
            }
        });
    } else {
        return callback(null, oauthDb);
    }
};

exports.update = function(db, sql, callback) {
    reserve(db, function(err, connobj, conn) {
        conn.createStatement(function(err, statement) {
            if (err) {
                release(db, connobj, err, null, callback);
            } 
            else {
                statement.executeUpdate(sql, function(err, result) {
                    release(db, connobj, err, result, callback);
                });
            }
        });
    });
};

exports.query = function(db, sql, callback) {
    reserve(db, function(err, connobj, conn) {
        conn.createStatement(function(err, statement) {
          if (err) {
            release(db, connobj, err, null, callback);
          }
          else {
            statement.setFetchSize(100, function(err) {
                if (err) {
                    release(db, connobj, err, null, callback);
                } 
                else {
                    statement.executeQuery(sql, function(err, resultset) {
                        if (err) {
                            release(db, connobj, err, null, callback);
                        } else {
                            resultset.toObjArray(function(err, results) {
                                if(results != undefined) {
                                    if (results.length > 0) {
                                        log.info("RESULT: ", results);
                                    }
                                    release(db, connobj, err, results, callback);
                                }
                                else {
                                    release(db, connobj, err, null, callback);
                                }
                            });
                        }
                    });
                }
            });
          }
        });
    });
};
