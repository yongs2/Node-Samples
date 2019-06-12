function task1(arg1, arg2, callback) {
   console.log('태스크 1 시작(', arg1, ", ", arg2, ")");
   setTimeout(function() {
      console.log('태스크 1 종료');
      callback('태스크 1 결과');
   }, 1000);       
}

function task2(arg, callback) {
   console.log('태스크 2 시작(', arg, ")");
   setTimeout(function() {
      console.log('태스크 2 종료');
      callback('태스크 2 결과');
   }, 1000);       
}

function task3(arg1, arg2, arg3, callback) {
   console.log('태스크 3 시작(', arg1, ", ", arg2, ")");
   setTimeout(function() {
      console.log('태스크 3 종료');
      callback('태스크 3 결과');
   }, 1000);       
}

function task4(arg1, arg2, callback) {
   console.log('태스크 4 시작(', arg1, ", ", arg2, ")");
   setTimeout(function() {
      console.log('태스크 4 종료');
      callback('태스크 4 결과');
   }, 1000);       
}

task1('a', 'b', function(result1) {
   var arg1 = result1.value;
    task2(arg1, function(result2) {
       var arg1 = result2.value; // 값이 안 넘어옴
        task3(arg1, 'e', 'f', function(result3) {
            task4('h', 'i', function(result4) {
                // 비동기 동작
            }); task4 
        }); // task3
    }); // task2
}); // task1
