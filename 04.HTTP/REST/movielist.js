var http = require('http');
var fs = require('fs');

var data = fs.readFileSync('./movieData.json');
var movieList = JSON.parse(data);

var server = http.createServer(function(req, res) {
    var method = req.method.toLowerCase();
    switch(method) {
        case 'get' :
            // 영화 목록 보기 : /movies
            // 영화 상세 정보 보기 : /movies/1, /movies/2
            handleGetRequest(req, res);
            return;
        case 'post' :
            // 영화 정보 추가 : /movies
            handlePostRequest(req, res);
            return;
        case 'put' :
            // 영화 정보 수정 : /movies/1, /movies/2
            handlePutRequest(req, res);
            return;
        case 'delete' :
            // 영화 정보 삭제 : /movies/1, /movies/2
            handleDeleteRequest(req, res);
            return;
        default :
            res.statusCode = 404;
            res.end('잘못된 요청입니다.');
            return;
    }
});
server.listen(3000);

function handleGetRequest(req, res) {
    var url = req.url;

    if(url == '/movies') {
        // 영화 목록 생성
        var list = [];
        for (var i=0; i<movieList.length; i++) {
            var movie = movieList[i];
            list.push({ id : movie.id, title : movie.title});
        }
        // 항목 갯수와 영화 목록 정보
        var result = {
            count : list.length,
            data : list
        }

        res.writeHead(200, {'Content-Type' : 'application/json;charset=utf-8'});
        res.end(JSON.stringify(result));
    }
    else {
        // 영화 상세 정보 제공
        // 요청 정보 분석 : URL 에서 id 찾기 (/movies/00
        var id = url.split('/')[2];
        var movie = null;
        
        // 영화 데이터베이스에서 영화 검색
        for(var i=0; i<movieList.length; i++) {
            var item = movieList[i];
            if (id == item.id) {
                movie = item;
                break;
            }
        }

        // 검색된 영화 정보 제공
        if(movie) {
            res.writeHead(200, {'Content-Type' : 'application/json;charset=utf-8'});
            res.end(JSON.stringify(movie));
        }
        else {
            // 영화 정보가 없는 경우
            res.writeHead(404, {'Content-Type' : 'application/json;charset=utf-8'});
            var message = {
                error :  {
                    code : 404,
                    message : '영화 정보가 없습니다.'
                }
            }
            res.end(JSON.stringify(message));
        }   
    }
}

function handlePostRequest(req, res) {

}