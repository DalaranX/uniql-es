'use strict';

var extend = require( 'extend' );
var _      = require('underscore');
var parse  = require( './index' ).parse;
var esCompile = require( './index').compile;

module.exports = compile;

function _identity( node ) {
    return node.arguments[ 0 ];
}

var generators = {
    "STRING": _identity,
    "SYMBOL": _identity,
    "AGG": function(node) {
      var comparison = _extractComparison( node );
      var symbol = _processNode(comparison.symbol)
      var _equals = {
      };
      _equals[symbol] = _processNode( comparison.value );
      return _equals;
    },
    "side": function(node) {
        var _and = {should: []};
        node.arguments.forEach( function( _node ) {
           _and.should.push( _processNode( _node ) );
        } );
        return _and;
    },
    "dive": function(node) {
      var _or =  {must: []};
      node.arguments.forEach( function( _node ) {
        _or.must.push( _processNode( _node ) );
      } );
      return _or;
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

function _parse(type, s) {
  if (type == 'filter') {
  } else {
    var o = {};
    _.each(s.split(','), function(t) {
      var tmp = t.split('==');
      o[tmp[0]] = tmp[1];
    })
    return o;
  }
  return {}
}

function _rec(node, agg) {
    console.log(node, agg);
    if (_.isObject(node)) {
      if(node.should) {
        _.each(node.should, function(o) {
          _rec(o, agg);
        })
      }
      else if(node.must) {
        _.each(node.must, function(o) {
          agg['aggs'] = {};
          agg = agg['aggs'];
          _rec(o, agg);
        })
      } else {
        var k = _.keys(node)[0];
        var symbol = k.split('.')[0];
        var type = k.split('.')[1];
        agg[symbol] = {};
        agg[symbol][type] = _parse(type, node[k]);
      }
    }
    return agg;
}

function compile( tree ) {
    var arr = _processNode( tree );
    var agg = {};
    _rec(arr, agg)
    return {aggs: agg};
}
