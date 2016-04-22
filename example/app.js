'use strict';

var koa = require('koa');
var mock = require('..');
var proxy = require('koa-grace-proxy');

var app = koa();

// 配置mock
app.use(mock(app, {
  root: './example/test/mock',
  NODE_ENV: 'development',
  prefix: '/__MOCK__/test/'
}));

// 配置api
app.use(proxy(app, {
  api: {
    test: 'http://127.0.0.1:3000/__MOCK__/test/'
  }
}));

app.use(function*() {
  yield this.proxy({
    data1: 'test:test1',
    data2: 'test:test2/test3?test=test',
    data3: 'test:test4/test5/test6?test=test',
  });

  this.body = this.backData || 'test';
});

app.listen(3000, function() {
  console.log('Listening on 3000!');
});
