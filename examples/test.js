var parse     = require( '../src/index' ).parse;
var esCompile = require( '../src/index').compile;
var util      = require('util');

var topic = '( height <= 20 or ( favorites.color == "green" and height != 25 and text like "google" ) ) and (firstname ~= "o.+" or text like "baidu")';

var queryAST = parse( topic );
var esQuery = esCompile(queryAST );

console.log(util.inspect(esQuery, { depth: null }));


