# npdynamodb-typecast
A npdynamodb plugin for casting hash and range key with actual attribute type.

## Usage
```js
var typeCast = require('npdynamodb-typecast');

var npd = npdynamodb.createClient(dynamodb, {
  initialize: function(){
    this.callbacks('beforeQuery', typeCast());
  }
});

npd().table('foo').where('hk', 1).where('rk', '2').then(function(data){
  done();
});
```
