var fs = require('fs');

try {
   fs.mkdirSync('test');
}
catch(err) {
   console.error('디렉토리 생성 에러 : ', err);
}

// test 폴더 감시
var watcher = fs.watch('test', function(event, filename) {
   console.log('파일 ', filename, ' 이벤트 : ' + event);
});

setTimeout(() => {
   console.log('파일 생성');
   fs.writeFileSync('test/test1.txt', 'Hello');
}, 1000);

setTimeout(() => {
   console.log('파일 이름 변경');   
   fs.renameSync('test/test1.txt', 'test/test2.txt');
}, 2000);

setTimeout(() => {   
   console.log('파일 삭제');   
   fs.unlinkSync('test/test2.txt');   
}, 3000);
   
setTimeout(() => {
   console.log("디렉토리 삭제");
   try {
      fs.rmdirSync('test');
      watcher.close();
   }
   catch(err) {
      console.error('디렉토리 삭제 에러 : ', err);
   }

}, 4000);


setTimeout(() => {
   console.log('감시 종료');
   watcher.close();
}, 5000);