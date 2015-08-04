UniQL-ES
=======

This generates ElasticSearch queries based on [UniQL](https://github.com/honeinc/uniql) ASTs.

support `query_string`, use `like` to replace

## Example

```javascript
var parse = require( 'uniql' );
var esCompile = require( 'uniql-es' );

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
                        [ { term: { 'favorites.color': 'green' } },
                        { bool: { must_not: { term: { height: 25 } } } } ] } },
                    { fquery:
                      { _cache: true,
query: { bool: { should: [ { query_string: { fields: [ 'text' ], query: '"google"' } } ] } } } } ] } } ] } },
            { bool: { must: { regexp: { firstname: 'o.+' } } } } ] } } ] } } }

```

## License

[MIT](LICENSE)
