'use strict';

var log = require('log4js').getLogger("passport");
var config = require('../config');
var passport = require('passport'),
    JWTstrategy = require('passport-jwt').Strategy,
    ExtractJWT = require('passport-jwt').ExtractJwt;

var oauthModel = require('./oauthModel');

const opts = {
    jwtFromRequest: ExtractJWT.fromAuthHeaderWithScheme('token'),
    secretOrKey: config.JWT.SECRET,
}

passport.use(
    'token',
    new JWTstrategy(opts, (jwt_payload, done) => {
        log.debug(">>> JWTstrategy : jwt_payload : ", jwt_payload);
        try {
            if((config.LOG.ENV == "development") && (jwt_payload.accessToken == "mochaTestAccessToken")) { // mochaTest only
                var result = {
                    accessToken: jwt_payload.accessToken,
                    clientId: "mochaTestClientId",
                    expires: "expires",
                    userId: "mochaTest.userid",
                    scope: "read,write"
                };
                done(null, result);
                return;
            }
            oauthModel.validAccessToken(jwt_payload.accessToken, function (err, result) {
                if (!err) {
                    log.debug(">>> validAccessToken : result : ", result);
                    var expDate = new Date(jwt_payload.exp * 1000);
                    var curDate = new Date();
                    log.debug(">>> iss=", jwt_payload.iss, ", exp=", expDate, ", Cur=", curDate);
                    if(curDate >= expDate) {
                        done(new Error("Expired"));
                    }
                    else {
                        done(null, result);
                    }
                } else {
                    log.info(">>> validAccessToken : err : ", err);
                    done(err);
                }
            });
        }
        catch(err) {
            done(err);
        }
    })
);