'use strict';

var JDBC = require('jdbc');
var jinst = require('jdbc/lib/jinst');
var asyncjs = require('async');

// isJvmCreated will be true after the first java call.  When this happens, the
// options and classpath cannot be adjusted.
if (!jinst.isJvmCreated()) {
    // Add all java options required by your project here.  You get one chance to
    // setup the options before the first java call.
    jinst.addOption("-Xrs");
    // Add all jar files required by your project here.  You get one chance to
    // setup the classpath before the first java call.
    jinst.setupClasspath(['../drivers/tibero5-jdbc.jar']);
}

var config = {
    // Required
    url: 'jdbc:tibero:thin:@127.0.0.1:8629:DEV_DB',
   
    // Optional
    //drivername: 'com.tmax.tibero.jdbc.TbDriver',
    minpoolsize: 10,
    maxpoolsize: 100,
   
    // Note that if you sepecify the user and password as below, they get
    // converted to properties and submitted to getConnection that way.  That
    // means that if your driver doesn't support the 'user' and 'password'
    // properties this will not work.  You will have to supply the appropriate
    // values in the properties object instead.
    user: 'user',
    password: 'password',
    properties: {}
  };

var insDb = new JDBC(config);
 
insDb.initialize(function(err) {
  if (err) {
    log.info(err);
  }
  log.info("initialize: ");
});

insDb.reserve(function(err, connObj) {
    // The connection returned from the pool is an object with two fields
    // {uuid: <uuid>, conn: <Connection>}
    if (connObj) {
      log.info("Using connection: " + connObj.uuid);
      // Grab the Connection for use.
      var conn = connObj.conn;
   
      // Adjust some connection options.  See connection.js for a full set of
      // supported methods.
      asyncjs.series([
        function(callback) {
          conn.setAutoCommit(false, function(err) {
            if (err) {
              callback(err);
            } else {
              callback(null);
            }
          });
        },
        function(callback) {
          conn.setSchema("test", function(err) {
            if (err) {
              callback(err);
            } else {
              callback(null);
            }
          });
        }
      ], function(err, results) {
        // Check for errors if need be.
        // results is an array.
      });

      log.info("Query the database: " + connObj.uuid);
      // Query the database.
    asyncjs.series([
        function(callback) {
          // CREATE SQL.
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              statement.executeUpdate("CREATE TABLE blah "
                                    + "(id int, name varchar(10), curr_date DATE, "
                                    + " time TIME, timestamp TIMESTAMP);",
                                    function(err, count) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, count);
                  log.info("CREATE TABLE: " + count);
                }
              });
            }
          });
        },
        function(callback) {
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              statement.executeUpdate("INSERT INTO blah "
                                    + "VALUES (1, 'Jason', CURRENT_DATE, "
                                    + "CURRENT_TIME, CURRENT_TIMESTAMP);",
                                    function(err, count) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, count);
                  log.info("INSERT TABLE: " + count);
                }
              });
            }
          });
        },
        function(callback) {
          // Update statement.
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              statement.executeUpdate("UPDATE blah "
                                    + "SET id = 2 "
                                    + "WHERE name = 'Jason';",
                                    function(err, count) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, count);
                  log.info("UPDATE TABLE: " + count);
                }
              });
            }
          });
        },
        /*
        function(callback) {
            // Select statement example.
            conn.createStatement(function(err, statement) {
              if (err) {
                callback(err);
              } else {
                // Adjust some statement options before use.  See statement.js for
                // a full listing of supported options.
                statement.setFetchSize(100, function(err) {
                  if (err) {
                    callback(err);
                  } else {
                    statement.executeQuery("SELECT * from TBL_HIST_MULANN WHERE STD_TIME >= '20190614000000'",
                                           function(err, resultset) {
                      if (err) {
                        callback(err)
                      } else {
                        resultset.toObjArray(function(err, results) {
                          if (results.length > 0) {
                              log.info("RESULT: ", results);
                          }
                          callback(null, resultset);
                        });
                        log.info("SELECT TABLE: ");
                      }
                    });
                  }
                });
              }
            });
          },
          */
        function(callback) {
          // Select statement example.
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              // Adjust some statement options before use.  See statement.js for
              // a full listing of supported options.
              statement.setFetchSize(100, function(err) {
                if (err) {
                  callback(err);
                } else {
                  statement.executeQuery("SELECT * FROM blah;",
                                         function(err, resultset) {
                    if (err) {
                      callback(err)
                    } else {
                      resultset.toObjArray(function(err, results) {
                        if (results.length > 0) {
                          log.info("ID: " + results[0].ID);
                        }
                        callback(null, resultset);
                      });
                      log.info("SELECT TABLE: ");
                    }
                  });
                }
              });
            }
          });
        },
        function(callback) {
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              statement.executeUpdate("DELETE FROM blah "
                                    + "WHERE id = 2;", function(err, count) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, count);
                  log.info("DELETE TABLE: " + count);
                }
              });
            }
          });
        },
        function(callback) {
          conn.createStatement(function(err, statement) {
            if (err) {
              callback(err);
            } else {
              statement.executeUpdate("DROP TABLE blah;", function(err, count) {
                if (err) {
                  callback(err);
                } else {
                  callback(null, count);
                  log.info("DROP TABLE: " + count);
                }
              });
            }
          });
        }
      ], function(err, results) {
        // Results can also be processed here.
        // Release the connection back to the pool.
        if(err != null) {
            log.info("ERR: " + err.message);
        }
        insDb.release(connObj, function(err) {
          if (err) {
            log.info(err.message);
          }
        });
      });
    }
});
