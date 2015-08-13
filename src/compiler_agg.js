'use strict';

var extend = require( 'extend' );
var _      = require('underscore');

module.exports = compile_agg;

function _parse(s, agg) {
  var p = s.split('@')[0];
  var n = s.split('@')[1];
  var name = p.split('.')[0];
  var type = p.split('.')[1];
  agg[name] = {};
  agg[name][type] = {};
  _.each(n.split(','), function(t) {
    var tmp = t.split('==');
    agg[name][type][tmp[0]] = tmp[1];
  })
  return name
}

function compile_agg( tree ) {
    var arr = tree.trim().split(' ');
    var agg = {};
    var s = agg;
    var len = arr.length
    var i = 0
    while (i < len) {
      var o = arr[i];
      if (!o.length) return;
      if (arr[i] != 'dive' && arr[i] != 'side')
        var name = _parse(o, agg);
        if (i-1>=0 && arr[i] == 'dive') {
          agg[name]['aggs'] = {}
          agg = agg[name]['aggs']
        }
      i++;
    }
    return {aggs: s};
}

//compile_agg('v3.value@field==v side total_user.cardinality@precision_thresold==4000,field==k.openid dive total.term@a==b dive t.terms@b==c')
