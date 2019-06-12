var async = require('async');

async.parallel(   // 여러 테스크를 동시에 실행
   [
      function(callback) {
         console.log('태스크 1 시작');
         setTimeout(function() {
            console.log('태스크 1 종료');  
            callback(null, '태스크 1 결과');          
         }, 1000);
      },
      function(callback) {
         console.log('태스크 2 시작');
         setTimeout(function() {
            console.log('태스크 2 종료');            
            callback(null, '태스크 2 결과');
         }, 2000);
      },
      errorTask,
      task3      
   ],
   function(err, results) {
      if ( err ) {
         console.error('에러 : ', err.message);
         return;
      }
      
      console.log('모든 태스크 종료, 결과 : ', results);
   }
);

function task3(callback) {
   console.log('태스크 3 시작');
   setTimeout(function() {
      console.log('태스크 3 종료');      
      callback(null, '태스크 3 결과');
   }, 2000);         
}

function errorTask(callback) {
   callback(new Error('Error'));
}