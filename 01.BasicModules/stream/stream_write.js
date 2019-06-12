var fs = require('fs');

var os = fs.createWriteStream('output.txt');

os.on('finish', function() {
    console.log('finish');
});

os.write('1234');
os.write('4567');
os.end('89');
