'strict'

var crypto = require('crypto');

var generateRandomToken = function (callback) {
    crypto.randomBytes(256, function (ex, buffer) {
        if (ex) return callback(error('server_error'));
  
        var token = crypto
                    .createHash('sha1')
                    .update(buffer)
                    .digest('hex').substr(0, 15);
  

        var resizedIV = 10;
        const key = crypto
            .createHash("sha256")
            .update(buffer)
            .digest(),
            cipher  = crypto.createCipher("aes256", buffer, resizedIV),
            msg = [];

        msg.push(cipher.final("hex"));

        console.log("aes256:", msg.join("").length, msg.join(""));

        return callback(null, token);
    });
};

var result = generateRandomToken(function(err, token) {
    console.log("token:", token.length, token);
});
console.log('server has started.'); 
