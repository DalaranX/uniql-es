'use strict';

var Jison = require( 'jison' );

module.exports = parse;

var grammar = {
    // Lexical tokens
    lex: {
        rules: [
            [ '\\s+',  '' ], // skip whitespace
            [ '\\(', 'return "(";' ],
            [ '\\)', 'return ")";' ],
            [ '==', 'return "==";' ],
            [ '\\!=', 'return "!=";' ],
            [ '>=', 'return ">=";' ],
            [ '<=', 'return "<=";' ],
            [ '<', 'return "<";' ],
            [ '>', 'return ">";' ],
            [ '~=', 'return "~=";' ],
            [ 'like_eq', 'return "like_eq";' ],
            [ 'like', 'return "like";' ],
            [ 'nested', 'return "nested";' ],
            [ 'not_like', 'return "not_like";' ],
            [ 'prefix', 'return "prefix";' ],
            [ 'and[^\\w]', 'return "and";' ],
            [ 'or[^\\w]' , 'return "or";' ],
            [ 'not[^\\w]', 'return "not";' ],
            [ 'in[^\\w]', 'return "in";' ],

            [ '[0-9]+(?:\\.[0-9]+)?\\b', 'return "NUMBER";' ], // 212.321
            [ 'true|false', 'return "BOOLEAN";' ], // true/false
            [ 'null|undefined', 'return "PRIMITIVE";' ],
            [ '[a-zA-Z_][\\.a-zA-Z0-9_]*', 'return "SYMBOL";' ], // some.Symbol22
            [ '"(?:[^"])*"', 'yytext = yytext.substr(1, yyleng-2); return "STRING";' ], // "foo"

            // End
            [ '$', 'return "EOF";' ],
        ]
    },
    // Operator precedence - lowest precedence first.
    // See http://www.gnu.org/software/bison/manual/html_node/Precedence.html
    // for a good explanation of how it works in Bison (and hence, Jison).
    // Different languages have different rules, but this seems a good starting
    // point: http://en.wikipedia.org/wiki/Order_of_operations#Programming_languages
    operators: [
        [ 'left', 'or' ],
        [ 'left', 'and' ],
        [ 'left', 'in' ],
        [ 'left', '==', '!=', 'like', 'not_like', 'like_eq', 'nested', 'prefix'],
        [ 'left', '<', '<=', '>', '>=', '~=' ],
        [ 'left', 'not' ],
        [ 'left', 'UMINUS' ],
    ],
    // Grammar
    bnf: {
        expressions: [ // Entry point
            [ 'e EOF', 'return $1;' ]
        ],
        e: [
            [ '- e'        , '$$ = { type: "-", arguments: [ $2 ] };', { prec: 'UMINUS' } ],
            [ 'e and e'    , '$$ = { type: "&&", arguments: [ $1, $3 ] };' ],
            [ 'e or e'     , '$$ = { type: "||", arguments: [ $1, $3 ] };' ],
            [ 'e in e'     , '$$ = { type: "IN", arguments: [ $1, $3 ] };' ],
            [ 'not e'      , '$$ = { type: "!", arguments: [ $2 ] };' ],
            [ 'e == e'     , '$$ = { type: "==", arguments: [ $1, $3 ] };' ],
            [ 'e != e'     , '$$ = { type: "!=", arguments: [ $1, $3 ] };' ],
            [ 'e ~= e'     , '$$ = { type: "MATCH", arguments: [ $1, $3 ] };' ],
            [ 'e < e'      , '$$ = { type: "<", arguments: [ $1, $3 ] };' ],
            [ 'e like e'   , '$$ = { type: "LIKE", arguments: [ $1, $3 ] };' ],
            [ 'e prefix e' , '$$ = { type: "PREFIX", arguments: [ $1, $3 ] };' ],
            [ 'e not_like e'   , '$$ = { type: "NOTLIKE", arguments: [ $1, $3 ] };' ],
            [ 'e like_eq e'   , '$$ = { type: "LIKEEQ", arguments: [ $1, $3 ] };' ],
            [ 'e nested e'   , '$$ = { type: "NESTED", arguments: [ $1, $3 ] };' ],
            [ 'e <= e'     , '$$ = { type: "<=", arguments: [ $1, $3 ] };' ],
            [ 'e > e'      , '$$ = { type: ">", arguments: [ $1, $3 ] };' ],
            [ 'e >= e'     , '$$ = { type: ">=", arguments: [ $1, $3 ] };' ],
            [ '( e )'      , '$$ = { type: "EXPRESSION", arguments: [ $2 ] };' ],

            // Literals
            [ 'NUMBER'     , '$$ = { type: "NUMBER", arguments: [ $1 ] };' ],
            [ 'BOOLEAN'    , '$$ = { type: "BOOLEAN", arguments: [ $1 ] };' ],
            [ 'PRIMITIVE'  , '$$ = { type: "PRIMITIVE", arguments: [ $1 ] };' ],
            [ 'STRING'     , '$$ = { type: "STRING", arguments: [ $1 ] };' ],
            [ 'SYMBOL'     , '$$ = { type: "SYMBOL", arguments: [ $1 ] };' ]
        ]
    }
};

var parser = new Jison.Parser( grammar );

function parse( expression ) {
    var tree = parser.parse( expression );
    return tree;
}
