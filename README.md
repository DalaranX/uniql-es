UniQL-ES
=======

This generates ElasticSearch queries based on [UniQL](https://github.com/honeinc/uniql) ASTs.

支持`query_string`, 用`like` and `not_like` 标识

支持多个词查询，比如 color 在 [red, green], 使用 color == "red,green", 其实正常应该用`in`来标示

## Example

```javascript
var parse     = require( '../src/index' ).parse;
var esCompile = require( '../src/index').compile;

var ast = parse( '( height <= 20 or ( favorites.color == "green" and height != 25 and text like "google" ) ) and firstname ~= "o.+"' );
var esQuery = esCompile( ast );
console.log( util.inspect( esQuery, { depth: null } ) );
```

Resulting query:

```
{ query:
  { filtered:
    { filter:
      [ { bool:
        { must:
          [ { bool:
            { should:
              [ { range: { height: { lte: 20 } } },
                { bool:
                  { must:
                    [ { bool:
                      { must:
                        [ { terms: { 'favorites.color': ['green'] } },
                        { bool: { must_not: { term: { height: 25 } } } } ] } },
                    { fquery:
                      { _cache: true,
query: { bool: { should: [ { query_string: { fields: [ 'text' ], query: '"google"' } } ] } } } } ] } } ] } },
            { bool: { must: { regexp: { firstname: 'o.+' } } } } ] } } ] } } }

```

## License

[MIT](LICENSE)
