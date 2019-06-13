var mysql      = require('mysql');

console.log('- process.env: ', process.env);
console.log("env.DB_HOST=", process.env.DB_HOST);

var connection = mysql.createConnection({
  host      : process.env.DB_HOST,    // 호스트 주소
  port      : process.env.DB_PORT,
  user      : process.env.DB_USER,           // mysql user
  password  : process.env.DB_PASS,       // mysql password
  database  : 'mysql_example'         // mysql 데이터베이스
});
connection.connect();
connection.query('SELECT 1 + 1 AS solution', 
function (error, results, fields) {
  if (error) throw error;
  console.log('The solution is: ', results[0].solution);
});
connection.end();