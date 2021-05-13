class SingleEntryPlugin {
  constructor (context, entry, name) {
    this.context = context;
    this.entry = entry;
    this.name = name;
  }

  apply (compiler) {
    // 监听make 开始编译的钩子
    compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
      const { context, entry, name} = this;
      /**
       * 编译入口文件和它的依赖
       * context 根目录
       * entry 入口模块路径 ./src/index.js
       * name 人口的名字 main
       * callback 最终的回调
       */
      compilation.addEntry(context, entry, name, callback);
    })
  }
}

module.exports = SingleEntryPlugin;