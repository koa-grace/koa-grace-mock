'use strict';

const path = require('path');
const fs = require('fs');
const debug = require('debug')('koa-grace:mock');

/**
 * 
 * @param  {string} app     context
 * @param  {object} options 配置项
 *         {string} options.path mock数据地址
 *         {object} options.prefix mock数据的url前缀 
 * @return {function}
 */
function _mock(app, options) {
  let prefix = options.prefix;
  let dirPath = options.root;

  if ((prefix.lastIndexOf('/') + 1) != prefix.length) {
    prefix = prefix + '/'
  }

  if ((dirPath.lastIndexOf('/') + 1) != dirPath.length) {
    dirPath = dirPath + '/'
  }

  return function*(next) {
    let curPath = this.path;
    if (curPath.indexOf(prefix) != 0) return yield * next;

    let result = getMockFile(curPath);

    if (result.code == 0) {
      this.body = result.data;
    } else {
      this.body = result;
    }

    debug(this.body);
  }

  function getMockFile(curPath) {
    let pathArr = curPath.split(prefix);

    let result = {
      code: 0
    };

    // 如果prefix之后不再有path则请求不合法
    // 例如：prefix为 __MOCK__/pay/但请求路径为http://*/__MOCK__/pay/
    if (pathArr.length < 2) {
      result.code = 1;
      result.message = '请求路径不合法！';
      return result;
    }

    // 根据path查找moc文件
    let pathDirArr = pathArr[1].split('/');
    let dir = '',
      lastArr;
    for (let i = 0; i < pathDirArr.length; i++) {
      if (i + 1 == pathDirArr.length) {
        dir += pathDirArr[i] + '.json';
        break;
      }

      let folderPath = path.resolve(dirPath + dir + pathDirArr[i]);
      if (fs.existsSync(folderPath)) {
        dir += pathDirArr[i] + '/';
      } else {
        dir += pathDirArr[i] + '.json';
        lastArr = pathDirArr.slice(i + 1);
        break;
      }
    }
    dir = path.resolve(dirPath, dir);
    debug('mock data at : ' + dir);

    // 如果mock文件不存在则返回错误
    if (!fs.existsSync(dir)) {
      result.code = 2;
      result.message = '找不到mock文件：' + dir;
      return result;
    }

    // 解析mock文件
    let mockFileData = fs.readFileSync(dir, 'utf8'),
      mockData;
    try {
      mockData = JSON.parse(mockFileData);
    } catch (err) {
      result.code = 3;
      result.message = 'mock文件格式不合法' + dir;
      return result;
    }

    if (!lastArr) {
      result.data = mockData;
      return result;
    }

    // 如果数据接口直接不是整个mock文件，而是mock对象的其中一个字段
    // 则查找mock对象
    let data = mockData;
    for (let i = 0; i < lastArr.length; i++) {
      let index = lastArr[i];

      // 如果请求路径是/__MOCK__/pay/test/test/
      // 则lastArr的最后一个字段是""，则排除
      if (index === '') {
        continue; }
        
      if (!data[index]) {
        result.code = 4;
        result.message = '找不到对应mock文件下的对应接口的数据' + dir;
        return result;
      }
      data = data[index];
    }
    result.data = data;

    return result;
  }
};

module.exports = _mock;
