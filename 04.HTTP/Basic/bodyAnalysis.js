const http = require('http');
const url = require('url');

const port = 3000;

const server = http.createServer( (req, res) => {
   let body = [];

   req.on('data', (chunk) => {
      console.log('Request data event : ', chunk);
      body.push(chunk); // body에 저장
   });

   req.on('end', () => {
      body = Buffer.concat(body).toString(); // request 의 body 정보 마무리
      console.log('Request end event : ' + JSON.stringify(body));

      // 요청을 모두 수신한 경우이므로, 여기서 응답을 최종적으로 작성해야 request 정보를 제대로 사용할 수 있다
      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.write(JSON.stringify(body));
      console.log('Response.body : ' + JSON.stringify(body));
      res.end();
   });
});

server.listen(port, () => {
   console.log(`Server running at ${port}`);
   console.log("EX) curl -X POST -H \"Content-Type: application/json\" -d '{ \"command\": \"config-get\"}' http://{HOST_IP}:3000 ");
});