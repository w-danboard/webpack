const Compiler = require('./Compiler');
const NodeEnvironmentPlugin = require('./node/NodeEnvironmentPlugin');
const WebpackOptionsApply = require('./WebpackOptionsApply');

/**
 * 
 * @param {*} options 选项 
 * @param {*} callback 回调函数
 * @returns 编译器对象
 */
const webpack = (options, callback) => {
  /**
   * 源码中的步骤 这里没有写
   *  第一步验验证配置文件是否合法 如果不合法报错
   *  第二步增加默认参数，因为webpack是零配置
   */
  let compiler = new Compiler(options.context); // 创建一个Compiler的实例
  compiler.options = options; // 给他赋予一个options属性
  new NodeEnvironmentPlugin().apply(compiler); // 让compiler可以读文件和写文件了
  // 挂载配置文件里提供的所有的plugins
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }
  // 初始化选项，挂载内置插件
  new WebpackOptionsApply().process(options, compiler);
  return compiler;
};

exports = module.exports = webpack;