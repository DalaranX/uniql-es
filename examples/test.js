var parse     = require( '../src/index' ).parse;
var esCompile = require( '../src/index').compile;
var util      = require('util');

var topic = '( height <= 20 or ( favorites.color == "green" and height != 25 and text like "google" ) ) and (firstname ~= "o.+" or text like "baidu")';

var queryAST = parse( topic );
var esQuery = esCompile(queryAST );

console.log(util.inspect(esQuery, { depth: null }));

var topic2 = '((platform == 0 and text like "宝马") or (platform == 5 and text like "宝马" and source.name == "微信自媒体")) and cdate >= "2015-07-29" and cdate <= "2015-08-04"'

queryAST = parse(topic2);
esQuery = esCompile(queryAST);
console.log(JSON.stringify(esQuery));

