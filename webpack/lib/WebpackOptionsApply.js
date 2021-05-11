const EntryOptionPlugin = require('./EntryOptionPlugin');

// 挂载内置插件
class WebpackOptionsApply {
  process (options, compiler) {
    new EntryOptionPlugin().apply(compiler);
    /**
     * 触发entryOption钩子
     * options.context 根目录的路径
     * options.entry 入口文件'./src/index.js'
     */
    compiler.hooks.entryOption.call(options.context, options.entry);
  }
}

module.exports = WebpackOptionsApply;