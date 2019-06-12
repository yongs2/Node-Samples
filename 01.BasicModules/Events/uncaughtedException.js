/**
 * Uncaughted Exception
 */
// ES6
process.on('uncaughtException', (code) => {
   console.log('uncaughtException 발생! : ' + code);  
});

// 없는 함수 실행
justDoIt();


console.log('== 정상 종료');