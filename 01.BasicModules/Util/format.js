const util = require('util');

console.log('== Format String ==');

// Number
var a = 1, b = 2;
const str1 = util.format('%d + %d = %d', a, b, (a+b));
console.log(str1);

// JSON Format
const obj = { name:'IU', job:'singer' };
const str2 = util.format('%j', obj);
console.log(str2);
console.log("format.%o =[" + util.format('%o', obj) + "]");
console.log("format.%O =[" + util.format('%O', obj) + "]");

// String
const str3 = util.format('%s %s', 'Hello', 'World');
console.log(str3);

const str4 = util.format(1, 2, 3);
console.log(str4);