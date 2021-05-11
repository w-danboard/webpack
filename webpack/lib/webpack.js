const Compiler = require('./Compiler');
const NodeEnvironmentPlugin = require('./node/NodeEnvironmentPlugin');
const WebpackOptionsApply = require('./WebpackOptionsApply');

/**
 * Webpack
 * @param {*} options 配置参数
 * @param {*} callback 回调函数
 * @returns 编译器对象
 */
const webpack = (options, callback) => {
  // 初始化参数，从配置文件和Shell语句中读取并合并参数。// TODO 待完善...
  let shellOptions = process.argv.slice(2).reduce((config, args) => {
    let [key, value] = args.split('=');
    config[key.slice(2)] = value;
    return config;
  }, {});
  options = {...options, ...shellOptions};
  // 校验参数是否合法 // TODO

  // 创建一个Compiler的实例
  let compiler = new Compiler(options.context);
  compiler.options = options;

  // 让compiler可以读写文件
  new NodeEnvironmentPlugin().apply(compiler);

  // 挂载配置文件里提供的所有插件
  if (options.plugins && Array.isArray(options.plugins)) {
    for (const plugin of options.plugins) {
      plugin.apply(compiler);
    }
  }
  // 挂载内置插件
  new WebpackOptionsApply().process(options, compiler);
  return compiler;
};

exports = module.exports = webpack;