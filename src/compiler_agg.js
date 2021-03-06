'use strict';

var extend = require( 'extend' );
var _      = require('underscore');
var parse  = require('./parser');
var compile = require('./compiler');

module.exports = compile_agg;

function _parse(s, agg) {
  var p = s.split('@')[0];
  var n = s.split('@')[1];
  var name = p.split('.')[0].trim();
  var type = p.split('.')[1].trim();
  agg[name] = {};
  agg[name][type] = {};
  if (type == 'filter') {
    var esq = compile(parse(n));
    agg[name][type] = esq.query.filtered.filter[0];
  } else {
    _.each(n.split(','), function(t) {
      var tmp = t.split('==');
      var value = tmp[1].replace(/(^\s*)|(\s*$)/g, "");
      if (tmp[0] == 'size' || tmp[0] == 'precision_thresold'
         || tmp[0] == 'min_doc_count')
        value = parseInt(tmp[1]);
      else if (tmp[0] == 'ranges') {
        var r = value.split('$');
        var range = [];
        _.each(r, function(item) {
          var temp = {};
          _.each(item.split('~'), function(o) {
            if (o[0] == 'k') temp.key = o.slice(1);
            if (o[0] == 'f') temp.from = parseFloat(o.slice(1));
            if (o[0] == 't') temp.to = parseFloat(o.slice(1));
          })
          range.push(temp);
        })
        value = range;
      }
      agg[name][type][tmp[0]] = value;
    })
  }
  return name
}

function compile_agg( tree ) {
    var arr = tree.trim().split(/side|dive/g);
    var op = [];
    _.each(tree.trim().split(' '), function(o) {
      if (o == 'side' || o == 'dive') op.push(o);
    });
    var agg = {};
    var s = agg;
    var len = arr.length;
    var i = 0, j = 0;
    var name;
    while (i < len) {
      var o = arr[i];
      if (!o.length) return;
      if (i > 0 && op[j] == 'dive') {
          agg[name]['aggs'] = {}
          agg = agg[name]['aggs']
      }
      name = _parse(o, agg);
      if (i > 0) j++;
      i++;
    }
    return {aggs: s};
}

//compile_agg('v3.value@field==v side total_user.cardinality@precision_thresold==4000,field==k.openid dive total.term@a==b dive t.terms@b==c')
