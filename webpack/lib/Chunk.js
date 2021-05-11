class Chunk {
  constructor (entryModule) {
    this.entryModule = entryModule; // 入口模块
    this.async = entryModule.async; // 是否是异步
    this.name = entryModule.name; // 代码块的名称 main
    this.files = []; // 生成的文件
    this.modules = []; // 包含的模块
  }
}

module.exports = Chunk;