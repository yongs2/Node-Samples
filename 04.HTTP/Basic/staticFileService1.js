const http = require('http');
const fs = require('fs');

const server = http.createServer( (req, res) => {
   // 이미지 파일 경로
   // const path = './image/dog.jpg';
   const path = './image/ct.jpg';   // 404 응답을 시험하기 위해 파일명 변경
   fs.readFile(path, (err, data) => {
      if ( err ) {
         console.log('err :', err);
         res.statusCode = 404;
         res.end('Not Found');
         return;         
      }
      res.statusCode = 200;
      res.setHeader('Content-type', 'image/jpg');
      res.end(data);
   });
});
server.listen(3000);