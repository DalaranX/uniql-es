'use strict';

var Jison = require( 'jison' );

module.exports = parse_agg;

var grammar = {
    // Lexical tokens
    lex: {
        rules: [
            [ '\\s+',  '' ], // skip whitespace
            [ '\\(', 'return "(";' ],
            [ '\\)', 'return ")";' ],
            [ 'agg', 'return "agg";' ],
            [ 'dive', 'return "dive";' ],
            [ 'side', 'return "side";' ],

            [ '[0-9]+(?:\\.[0-9]+)?\\b', 'return "NUMBER";' ], // 212.321
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
        [ 'left', 'side'],
        [ 'left', 'dive'],
        [ 'left', 'agg']
    ],
    // Grammar
    bnf: {
        expressions: [ // Entry point
            [ 'e EOF', 'return $1;' ]
        ],
        e: [
            [ 'e dive e'   , '$$ = { type: "dive", arguments: [ $1, $3 ] };' ],
            [ 'e side e'   , '$$ = { type: "side", arguments: [ $1, $3 ] };' ],
            [ 'e agg e'   , '$$ = { type: "AGG", arguments: [ $1, $3 ] };' ],
            [ '( e )'      , '$$ = { type: "EXPRESSION", arguments: [ $2 ] };' ],

            // Literals
            [ 'STRING'     , '$$ = { type: "STRING", arguments: [ $1 ] };' ],
            [ 'SYMBOL'     , '$$ = { type: "SYMBOL", arguments: [ $1 ] };' ]
        ]
    }
};

var parser = new Jison.Parser( grammar );

function parse_agg( expression ) {
    var tree = parser.parse( expression );
    return tree;
}
