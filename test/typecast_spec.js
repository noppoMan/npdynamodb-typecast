var AWS = require('aws-sdk');
var npdynamodb = require('npdynamodb');
var Promise = require('bluebird');

var config = {
  apiVersion: '2012-08-10',
  accessKeyId: process.env.DYNAMO_KEY || "AWS_KEY",
  secretAccessKey: process.env.DYNAMO_SECRET_KEY || "AWS_SECRET",
  region: process.env.AWS_REGION || "ap-northeast-1",
  sslEnabled: false
};

if(process.env.DYNAMO_ENDPOINT) {
  config.endpoint = process.env.DYNAMO_ENDPOINT;
}

var dynamodb = new AWS.DynamoDB(config);

var typeCast = require('../index');

var npd = npdynamodb.createClient(dynamodb, {
  initialize: function(){
    this.callbacks('beforeQuery', typeCast());
  }
});

var migrator = npdynamodb.Migrator.create(npd);

describe('Typecast Spec', function(){

  before(function(done){
    new Promise(function(resolve, reject){
      migrator().createTable('typecast-test', function(t){
        t.string('hk').hashKey();
        t.number('rk').rangeKey();
        t.provisionedThroughput(10, 10);
      })
      .then(resolve)
      .catch(resolve);
    })
    .then(function(){
      return npd().table('typecast-test').create([
        {
          hk: 1,
          rk: "1",
          foo: 'bar'
        },
        {
          hk: 1,
          rk: "2",
          foo: 'bar'
        }
      ]);
    }).then(function(data){
      done();
    });
  });

  after(function(done){
    migrator().deleteTable('typecast-test').then(function(){
      done();
    });
  });

  it('Auto cast where condition type', function(done){
    npd().table('typecast-test').where('hk', 1).where('rk', '2').then(function(data){
      done();
    });
  });
});
