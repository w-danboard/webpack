class SingleEntryPlugin {
  constructor (context, entry, name) {
    this.context = context;
    this.entry = entry; // 入口模块路径 ./src/index.js
    this.name = name; // 让人口的名字 main
  }

  apply (compiler) {
    // 监听make钩子 (这边属于注册钩子)
    compiler.hooks.make.tapAsync('SingleEntryPlugin', (compilation, callback) => {
      const { context, entry, name} = this;
      // 从此入口开始编译，编译入口文件和它的依赖
      console.log('SingleEntryPlugin make')
      // 开始编译一个新的入口 context根目录 entry入口文件的相对路径 name main callback最终的回调
      compilation.addEntry(context, entry, name, callback);
    })
  }
}

module.exports = SingleEntryPlugin;