/**
 * 이벤트 다루기
 */

// On - 이벤트 리스너 등록.
// 같은 이벤트에 대해서 이벤트 리스너를 2개 등록 - 둘다 모두 동작
// ES6. 
process.on('exit', code => {
   console.log('1.Exit event : ' + code); 
});

process.addListener('exit', function(code) {
   console.log('2.Exit event : ' + code);
});


// Once - 이벤트 리스너 등록
process.once('exit', ()=> {
   console.log('Exit 이벤트 최초 발생');
});
