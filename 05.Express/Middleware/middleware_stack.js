const express = require('express');
const app = express();

// 2개의 미들웨어를 스택 형태로 설정
app.use(logger, sayHello);

// next() 를 호출해야 다음 미들웨어 실행
function logger(req, res, next) {
    var now = new Date();
    console.log(now.toDateString());

    next();
}

// 다음에 실행될 미들웨어가 없으면, next 를 사용하지 않아도 된다.
function sayHello(req, res) {
    res.send('Say Hello !!!');
}

app.listen(3000);
