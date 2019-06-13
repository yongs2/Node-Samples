const mysql = require('mysql');

const dbConfig = {
   host      : process.env.DB_HOST,    // 호스트 주소
   port      : process.env.DB_PORT,
   user      : process.env.DB_USER,           // mysql user
   password  : process.env.DB_PASS,       // mysql password
   database  : 'mysql_example'         // mysql 데이터베이스
};

const pool = mysql.createPool(dbConfig);

module.exports = pool;