var http = require('http');

var movieList = [{title:'아바타', director:'제임스 카메론'}];

http.createServer(function(req, res) {
    if(req.method.toLowerCase() == 'post')  {
        var buffer = '';
        req.on('data', function(chunck) {
            buffer += chunck;
        });

        req.on('end', function() {
            var parsed = JSON.parse(buffer);
            var titleData = parsed.title;
            var directorData = parsed.director;

            movieList.push({title:titleData, director:directorData});

            res.writeHead(200, {'Content-Type' : 'application/json'});
            res.end(JSON.stringify({result:'success'}));
        });
    }
    else {
        var result = {
            count : movieList.length,
            data : movieList
        };
        res.writeHead(200, {'Content-Type' : 'application/json'});
        res.end(JSON.stringify(result));
    }
}).listen(3000);