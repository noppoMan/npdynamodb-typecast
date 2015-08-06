var _ = require('lodash');
var Promise = require('bluebird');
var Buffer = require('buffer');

module.exports = function(opts){
  return function(){
    if(_.contains(['createTable', 'deleteTable'], this._feature.nextThen)) {
      return;
    }

    var schemaCaches = {};

    var typeCaster = {
      N: function(v){
        return parseFloat(v);
      },
      S: function(v){
        return v.toString();
      },
      B: function(v){
        return new Buffer(v.toString());
      }
    };

    function getSchema(){
      var table = this.tableName();

      return new Promise(function(resolve){
        if(!schemaCaches[table]){
          this.rawClient().describeTable({TableName: table}).then(function(result){
            schemaCaches[table] = {};

            var attrTypes = {};
            _.each(result.Table.AttributeDefinitions, function(t){
              attrTypes[t.AttributeName] = t.AttributeType;
            });
            schemaCaches[table] = attrTypes;
            resolve(schemaCaches[table]);

          }.bind(this));
        }else{
          return resolve(schemaCaches[table]);
        }
      }.bind(this));
    }

    return getSchema.call(this).then(function(schema){
      ['whereConditions', 'filterConditions'].forEach(function(condition){
        if(this._feature[condition].length > 0){
          this._feature[condition] = this._feature[condition].map(function(cond){
            var type = schema[cond.key];
            if(type){
              cond.values = cond.values.map(function(v){
                return typeCaster[type](v);
              });
            }
            return cond;
          });
        }
      }.bind(this));

       _.each(this._feature.params, function(param){
        _.each(param, function(v, k){
          var type = schema[k];
          if(type) {
            param[k] = typeCaster[type](v);
          }else{
            param[k] = v;
          }
        });
        return param;
      });

    }.bind(this));
  };
};
