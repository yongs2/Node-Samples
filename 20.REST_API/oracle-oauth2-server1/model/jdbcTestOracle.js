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
    jinst.setupClasspath(['../drivers/ojdbc14.jar']);
}

var config = {
    // Required
    url: 'jdbc:oracle:thin:@192.168.0.208:1521:ORCL',
   
    // Optional
    drivername: 'oracle.jdbc.driver.OracleDriver',
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
    console.info(err);
  }
  console.info("initialize: ");
});

insDb.reserve(function(err, connObj) {
    // The connection returned from the pool is an object with two fields
    // {uuid: <uuid>, conn: <Connection>}
    if (connObj) {
      console.info("Using connection: " + connObj.uuid);
      // Grab the Connection for use.
      var conn = connObj.conn;
   
      console.info("Query the database: " + connObj.uuid);
      // Query the database.
    asyncjs.series([
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
                  // getClient
                  var query = "";
                  var client_id = "C180817100703"; // "C180827025444"; // "C180827014953"; //"C181001112205"; // "C180928040350"; //"C180913050046";
                  var client_secret = "$2a$10$VtIxYGbe3QM6BxWSwoRaF.iAx1Uioabvk21iWPD./pw4guEPmGWcO";

                  query += "select ";
                  query += " B.CLIENT_ID ";
                  query += ", C.SERVICE_ID ";
                  query += ", C.SCOPE_READ ";
                  query += ", C.SCOPE_WRITE ";
                  query += ", D.NAME SERVICE_NAME ";
                  query += ", DECODE(C.SCOPE_READ,'Y',D.NAME || '_read', '') SCOPE_READ_NAME ";
                  query += ", DECODE(C.SCOPE_WRITE,'Y',D.NAME || '_write', '') SCOPE_WRITE_NAME ";
                  query += "from JAPI.OAUTH_CLIENT_DETAILS B ";
                  query += "LEFT JOIN JAPI.OAUTH_CLIENT_SERVICE C on (B.CLIENT_ID = C.CLIENT_ID) ";
                  query += "LEFT JOIN JAPI.TBL_CF_SERVICE D on (C.SERVICE_ID = D.ID) ";
                  query += "where 1=1 ";
                  query += "AND B.CLIENT_ID = '" + client_id + "' ";
                  query += "ORDER BY B.CLIENT_ID, C.SERVICE_ID";
                  console.log("query=", query);
                  
                  statement.executeQuery(query,
                                         function(err, resultset) {
                    if (err) {
                      callback(err)
                    } else {
                      resultset.toObjArray(function(err, results) {
                        if (results.length > 0) {
                          console.info("results: ", results);
                        }
                        callback(null, resultset);
                      });
                      console.info("SELECT TABLE: ");
                    }
                  });
                }
              });
            }
          });
        },
      ], function(err, results) {
        // Results can also be processed here.
        // Release the connection back to the pool.
        if(err != null) {
            console.info("ERR: " + err.message);
        }
        insDb.release(connObj, function(err) {
          if (err) {
            console.info(err.message);
          }
        });
      });
    }
});
