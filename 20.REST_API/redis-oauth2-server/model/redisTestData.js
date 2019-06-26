#! /usr/bin/env node
'use strict';

var db = require('redis').createClient({
    url : "redis://:password@192.168.0.208:6379/1"
});

db.multi()
    .hmset('users:username', {
        id: 'username',
        username: 'username',
        password: 'password'
    })
    .hmset('clients:client', {
        clientId: 'client',
        clientSecret: 'secret',
        scope: "read,test"
    })
    .exec(function (errs) {
        if (errs) {
            console.error(errs[0].message);
            return process.exit(1);
        }

        console.log('Client and user added successfully');
        process.exit();
    });
