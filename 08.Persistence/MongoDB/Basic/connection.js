const MongoClient = require('mongodb').MongoClient
const url = 'mongodb://localhost:27017/example';

let db;

MongoClient.connect(url, (err, database) => {
  console.log("MongoDB 연결 성공");
  
  db = database;
});
