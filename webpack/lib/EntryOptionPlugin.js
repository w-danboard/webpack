const SingleEntryPlugin = require('./SingleEntryPlugin');

const itemToPlugin = (context, item, name) => {
  // 单入口插件
  return new SingleEntryPlugin(context, item, name);
}

/**
 * 它是一切的入口 
 */
class EntryOptionPlugin {
  apply (compiler) {
    /**
     * @param context 项目根目录
     * @param entry入 口文件相对路径
     */
    compiler.hooks.entryOption.tap('EntryOptionPlugin', (context, entry) => {
      itemToPlugin(context, entry, 'main').apply(compiler)
    });
  }
}

module.exports = EntryOptionPlugin;