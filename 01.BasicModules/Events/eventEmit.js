/**
 * 이벤트 발생시키기
 */

const event = require('events');
const EventEmitter = event.EventEmitter;

// EventEmitter 객체 생성
const obj = new EventEmitter();

// 프로세스 종료시 이벤트 발생
process.on('exit', function(code) {
    console.log('occur exit event : ' + code);
})

// howAreYou 이벤트와 이벤트 핸들러 등록
obj.on('howAreYou', () => {
    console.log('Fine thank you, and you?')
});

// 이벤트 발생시키기
obj.emit('howAreYou');
obj.emit('howAreYou');

obj.once('hello', () => {
    console.log('Hello Node.js');
});

console.log("emit : " + process.emit('exit', 1));    // 이벤트 발생

// once는 1번만 발생
obj.emit('hello');
obj.emit('hello');
