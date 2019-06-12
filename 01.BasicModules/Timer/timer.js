/**
 * 타이머 예제
 */

// Timer Sample
function sayHello() {
   console.log('Hello World');
}

console.log('== Timer Example.');
setTimeout(sayHello, 3 * 1000);


// Arrow Function과 파라미터 전달
setTimeout( (arg1, arg2) => {
      var result = arg1 + arg2;
      console.log('Arrow Function, parameter를 사용한 타이머 예제');
      console.log(`${arg1} + ${arg2} = ${arg1 + arg2}`)
}, 1000, 1, 2);   // 1번째는 Function 정의, 2번째는 Timeout 값, 3번째는 function의 arg1, 4번째에는 function 의 arg2 값을 설정

// 타이머 취소
function cancelledFunction() {
      console.log('이 함수는 실행 취소됩니다');
}
const t = setTimeout(cancelledFunction, 2000);
clearTimeout(t);
