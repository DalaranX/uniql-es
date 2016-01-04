'use strict';

var extend = require( 'extend' );
var _      = require('underscore');
var parse  = require('./parser');

module.exports = compile;

function _identity( node ) {
    return node.arguments[ 0 ];
}

var generators = {
    "NUMBER": function( node ) {
        var value = _identity( node );
        return value.indexOf( '.' ) < 0 ? parseInt( value, 10 ) : parseFloat( value );
    },
    "BOOLEAN": function( node ) {
        var value = _identity( node );
        return value.toLowerCase() === 'true';
    },
    "PRIMITIVE": function( node ) {
        var value = _identity( node );
        switch ( value.toLowerCase() ) {
            case 'null':
                value = null;
                break;
            case 'undefined':
                value = undefined;
                break;
        }
        return value;
    },
    "STRING": _identity,
    "SYMBOL": _identity,

    "-": function( node ) {
        return -_identity( node );
    },
    "&&": function( node ) {
        var _and = { bool: { must: [] } };
        node.arguments.forEach( function( _node ) {
           _and.bool.must.push( _processNode( _node ) );
        } );
        return _and;
    },
    "||": function( node ) {
        var _or = { bool: { should: [] } };
        node.arguments.forEach( function( _node ) {
            _or.bool.should.push( _processNode( _node ) );
        } );
        return _or;
    },
    "IN": function( node ) {
        var value = _processNode( node.arguments[ 0 ] );
        var field = _processNode( node.arguments[ 1 ] );
        var _in = {};
        _in[ field ] = {
            $in: [ value ]
        };
    },
    "!": function( node ) {
        return { bool: { must_not: [ _processNode( node.arguments[ 0 ] ) ] } };
    },
    "==": function( node ) {
        var comparison = _extractComparison( node );
        var _equals = {
            terms: {}
        };
        var value = _processNode(comparison.value);
        if (_.isString(value))
          value = value.split(',')
        else
          value = [value]
        _equals.terms[ _processNode( comparison.symbol ) ] = value;
        return _equals;
    },
    "NESTED": function( node ) {
        var comparison = _extractComparison( node );
        var node = _processNode(comparison.symbol);
        var value = _processNode(comparison.value).replace(/'/g, '"');
        var ast = parse(value);
        var esq = _processNode(ast);
        var _nested = {
          path: node,
          query: esq
        };
        return {nested: _nested};
    },
    "!=": function( node ) {
        var comparison = _extractComparison( node );
        var _nequals = {
            bool: {
                must_not: {
                    terms: {}
                }
            }
        };
        var value = _processNode(comparison.value);
        if (_.isString(value))
          value = value.split(',')
        else
          value = [value]
        _nequals.bool.must_not.terms[ _processNode( comparison.symbol ) ] = value;
        return _nequals;
    },
    "LIKE": function( node ) {
        var comparison = _extractComparison( node );
        var symbol = _processNode(comparison.symbol);
        var value = _processNode(comparison.value);
        value = value.split(',');
        var s = 0;
        var step = 1000;
        var len = value.length
        var q = {
          fquery: {
            _cache: true,
            query: {
              bool: {
                should: []
              }
            }
          }
        };
        while (true) {
          var t = s + Math.min(len - s, step);
          var tmp = value.slice(s, t);
          var term = {
            query_string: {
              fields: [symbol],
              query: _.map(tmp, function(v) {
                k = v.trim().split(' ');
                return "(" + _.map(k, function(o) {
                  return "\"" + o.trim().split(' ') + "\"";
                }).join(' AND ') + ")"
              }).join(" OR ")
            }
          };
          q.fquery.query.bool.should.push(term);
          s = s + Math.min(len - s, step)
          if (s >= len)
            break
        }
        return q
    },
    "LIKEEQ": function( node ) {
        var comparison = _extractComparison( node );
        var symbol = _processNode(comparison.symbol);
        var value = _processNode(comparison.value);
        value = value.split(',');
        var q = {
          fquery: {
            _cache: true,
            query: {
              query_string: {
                fields: [symbol],
                query: _.map(value, function(v) {return "\"" + v.trim() + "\"";}).join(" OR ")
              }
            }
          }
        };
        return q
    },
    "NOTLIKE": function( node ) {
        var comparison = _extractComparison( node );
        var symbol = _processNode(comparison.symbol);
        var value = _processNode(comparison.value);
        value = value.split(',');
        var q = {
          bool: {
            must_not: {
              fquery: {
                _cache: true,
                query: {
                  query_string: {
                    fields: [symbol],
                    query: _.map(value, function(v) {return "\"" + v.trim() + "\"";}).join(" OR ")
                  }
                }
              }
            }
          }
        };
        return q
    },
    "MATCH": function( node ) {
        var comparison = _extractComparison( node );
        var _match = {
            bool: {
                must: {
                    regexp: {}
                }
            }
        };
        _match.bool.must.regexp[ _processNode( comparison.symbol ) ] = _processNode( comparison.value );
        return _match;
    },
    "PREFIX": function(node) {
        var comparison = _extractComparison( node );
        var _prefix = {
          prefix: {
          }
        };
        _prefix.prefix[ _processNode( comparison.symbol ) ] = _processNode( comparison.value );
        return _prefix;

    },
    "<": function( node ) {
        var comparison = _extractComparison( node );
        var _lt = {
            range: {}
        };
        _lt.range[ _processNode( comparison.symbol ) ] = {
            lt: _processNode( comparison.value )
        };
        return _lt;
    },
    "<=": function( node ) {
        var comparison = _extractComparison( node );
        var _lte = {
            range: {}
        };
        _lte.range[ _processNode( comparison.symbol ) ] = {
            lte: _processNode( comparison.value )
        };
        return _lte;
    },
    ">": function( node ) {
        var comparison = _extractComparison( node );
        var _gt = {
            range: {}
        };
        _gt.range[ _processNode( comparison.symbol ) ] = {
            gt: _processNode( comparison.value )
        };
        return _gt;
    },
    ">=": function( node ) {
        var comparison = _extractComparison( node );
        var _gte = {
            range: {}
        };
        _gte.range[ _processNode( comparison.symbol ) ] = {
            gte: _processNode( comparison.value )
        };
        return _gte;
    },
    "EXPRESSION": function( node ) {
        var _expression = {};
        node.arguments.forEach( function( _node ) {
            extend( _expression, _processNode( _node ) );
        } );
        return _expression;
    }
};

function _extractComparison( node ) {
    var symbol = null;
    var value = null;
    node.arguments.forEach( function( _node ) {
        if ( _node.type === 'SYMBOL' ) {
            if ( symbol ) {
                throw new Error( 'ELASTICSEARCH: You can only specify one symbol in a comparison.' );
            }
            symbol = _node;
        } else {
            if ( value ) {
                throw new Error( 'ELASTICSEARCH: You can only specify one value in a comparison.' );
            }
            value = _node;
        }
    } );

    if ( !( symbol && value ) ) {
        throw new Error( 'ELASTICSEARCH: Invalid comparison, could not find both symbol and value.' );
    }

    return {
        symbol: symbol,
        value: value
    };
}

function _processNode( node ) {
    if ( !( node.type in generators ) ) {
        throw new Error( 'invalid node type' );
    }

    return generators[ node.type ]( node );
}

function compile( tree ) {
    var query = {
        query: {
            filtered: {}
        }
    };
    query.query.filtered.filter = [ _processNode( tree ) ];
    return query;
}
