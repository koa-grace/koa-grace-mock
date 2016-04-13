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

    if (pathArr.length < 2) {
      result.code = 1;
      result.message = '请求路径不合法！';
      return result;
    }

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
        lastArr = pathDirArr.slice(i);
        break;
      }
    }

    dir = path.resolve(dirPath, dir);
    debug('mock data at : ' + dir);

    if (!fs.existsSync(dir)) {
      result.code = 2;
      result.message = '找不到mock文件：' + dir;
      return result;
    }

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

    let data = mockData;
    for (let i = 0; i < lastArr.length; i++) {
      let index = lastArr[i];
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
