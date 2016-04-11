## koa-grace-mock

KOA-grace模拟数据的中间件

### Install

    $ npm install koa-grace-mock --save

### Usage

```
mock(app, options)
```
- app     context
- options 配置项
- options.path mock数据地址
- options.prefix mock数据的url前缀 http://localhost:3000'}

**app.js**

```
'use strict';

var koa = require('koa');
var mock = require('..');
var proxy = require('koa-grace-proxy');

var app = koa();

// 配置mock
app.use(mock(app, {
  prefix: '/__MOCK__/test/',
  path: './example/test/mock'
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
    data2: 'test:test2/test3',
    data3: 'test:test4/test5/test6',
  });

console.log('this.backData:',this.backData);

  this.body = this.backData || 'test';
});

app.listen(3000, function() {
  console.log('Listening on 3000!');
});
```

### Test

    npm test

### License

MIT