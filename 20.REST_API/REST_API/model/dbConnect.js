'use strict';

var log = require('log4js').getLogger("dbConnection");
var JDBC = require('jdbc');
var jinst = require('jdbc/lib/jinst');

if (!jinst.isJvmCreated()) {
    jinst.addOption("-Xrs");
    jinst.setupClasspath(['./drivers/tibero5-jdbc.jar']);
}

var insDb = new JDBC({
    url: process.env.DB_URL,
    minpoolsize: process.env.DB_MINPOOL,
    maxpoolsize: process.env.DB_MAXPOOL,
    user: process.env.DB_USER,
    password: process.env.DB_PASS
});
var insDbInit = false;

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

exports.insDb = function(callback) {
    if (!insDbInit) {
        insDb.initialize(function(err) {
            if (err) {
                return callback(err);
            } 
            else {
                insDbInit = true;
                log.info("Success to connect DB");
                return callback(null, insDb);
            }
        });
    } else {
        return callback(null, insDb);
    }
};

exports.update = function(db, sql, callback) {
    reserve(db, function(err, connobj, conn) {
        if(err) {
            release(db, connobj, err, null, callback);
        }
        else {
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
        }
    });
};

exports.query = function(db, sql, callback) {
    reserve(db, function(err, connobj, conn) {
        if(err) {
            release(db, connobj, err, null, callback);
        }
        else {
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
                                            log.debug("RESULT: ", results);
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
        }
    });
};
