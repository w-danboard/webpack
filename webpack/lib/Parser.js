const babylon = require('babylon'); // 解析器 [bable解析器]]
const { Tapable } = require('tapable');

/**
 * 编译器在解析语法树的期间，可能会发布一些事件
 */
class Parser extends Tapable {
  // source是源代码
  parse (source) {
    return babylon.parse(source, {
      sourceType: 'module', // 源代码是一个模块
      plugins: ['dynamicImport'] // 额外一个插件，支持import('./title.js');
    });
  }

  traverse () {
    
  }
}

module.exports = Parser;