const fs = require('fs');
const path = require('path');
let async = require('neo-async');
const { Tapable, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const normalModuleFactory = new NormalModuleFactory();
const Parser = require('./Parser');
let parser = new Parser();
const Chunk = require('./Chunk');
const ejs = require('ejs');
const mainTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'asyncMain.ejs'), 'utf8');
const mainRender = ejs.compile(mainTemplate); // 模板经过编译会返回一个函数，向里面传参即可
const chunkTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'chunk.ejs'), 'utf8');
const chunkRender = ejs.compile(chunkTemplate);

class Compilation extends Tapable {
  constructor (compiler) {
    super();
    this.compiler = compiler; // 编译器对象
    this.options = compiler.options; // 配置参数
    this.context = compiler.context; // 根目录
    this.inputFileSystem = compiler.inputFileSystem; // 读取文件模块fs
    this.outputFileSystem = compiler.outputFileSystem; // 写入文件的模块fs
    this.entries = []; // 入口信息
    this.modules = []; // 模块信息
    this.chunks = []; // 代码块信息
    this.files = []; // 文件信息
    this.assets = {}; // 生成资源 key是文件名 值是文件的内容
    this.hooks = {
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook(),
      succeedModule: new SyncHook(['module'])
    }
  }

  /**
   * 开始编译一个新的入口
   * @param {*} context 根目录
   * @param {*} entry 入口模块的相对路径 ./src/index.js
   * @param {*} name 入口的名字 main
   * @param {*} callback 编译完成的最终回调
   */
  addEntry (context, entry, name, finalCallback) {
    this._addModuleChain(context, entry, name, false, (err, module) => {
      finalCallback(err, module);
    });
  }

  /**
   * 创建模块链条
   * @param {*} context 根目录
   * @param {*} rawRequest 入口模块的相对路径 ./src/index.js
   * @param {*} name 入口的名字 main
   * @param {*} async 是否是异步加载
   * @param {*} callback 编译完成的最终回调
   */
  _addModuleChain (context, rawRequest, name, async, callback) {
    this.createModule({
      name,
      context,
      rawRequest,
      parser,
      async,
      resource: path.posix.join(context, rawRequest)
    }, entryModule => {
      this.entries.push(entryModule)
    }, callback);
  }

  /**
   * 创建并编译一个模块
   * @param {*} data 编译的模块信息
   * @param {*} addEntry 是否是入口模块, 是就添加到entries里
   * @param {*} callback 编译完成的最终回调 // TODO 源码为啥搞这么多回调函数,不直接用Promise?
   */
  createModule (data, addEntry, callback) { 
    let module = normalModuleFactory.create(data); // 通过模块工厂 创建一个模块
    addEntry && addEntry(module);
    this.modules.push(module);
    const afterBuild = (err, module) => {
      // 编译依赖的模块, 大于0说明有依赖
      if (module.dependencies.length > 0) {
        this.processModuleDependencies(module, err => {
          callback(err, module);
        })
      } else {
          callback(null, module)
      }
    }
    this.buildModule(module, afterBuild);
  }

  /**
   * 编译模块
   * @param {*} module 要编译的模块
   * @param {*} afterBuild 编译完成后的回调
   */
   buildModule (module, afterBuild) {
    module.build(this, err => {
      this.hooks.succeedModule.call(module);
      afterBuild(err, module)
    })
  }

  /**
   * 处理编译模块依赖
   * @param {*} module 当前的模块
   * @param {*} callback 编译完成的最终回调
   */
  processModuleDependencies (module, callback) {
    let dependencies = module.dependencies; // 获取当前模块的依赖
    // 遍历依赖模块，当所有的依赖模块全部编译完成之后，调用callback
    async.forEach(dependencies, (dependency, done) => {
       let { name, context, rawRequest, resource, moduleId } = dependency;
       this.createModule({
          name,
          context,
          rawRequest,
          parser,
          resource,
          moduleId
        }, null, done);
    }, callback)
  }

  /**
   * 把模块封装成代码块Chunk
   * @param {*} callback 封装代码块后的回调, 也就是最终回调 // TODO 为啥这么多回调而不用Promise这种？迷糊...
   */
  seal (callback) {
    this.hooks.seal.call();
    this.hooks.beforeChunks.call();
    // TODO 正常应该每个入口都会生成一个代码块吧？？？
    for (const entryModule of this.entries) {
      const chunk = new Chunk(entryModule); // 根据入口模块得到一个代码块
      this.chunks.push(chunk);
      // 过滤所有模块，找出名称与chunk一样的模块，组成一个数组赋给chunk.modules
      chunk.modules = this.modules.filter(module => module.name === chunk.name);
    }
    this.hooks.afterChunks.call(this.chunks);
    // 生成代码块之后，生成代码块对应的资源
    this.createChunkAssets();
    callback();
  }

  /**
   * 生成代码块对应的资源
   */
  createChunkAssets () {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      chunk.files = [];
      const file = chunk.name + '.js';
      chunk.files.push(file);
      let source;
      if (chunk.async) {
        // 异步代块
        source = chunkRender({
          chunkName: chunk.name,
          modules: chunk.modules
        });
      } else {
        // 同步代码块
        source = mainRender({
          entryModuleId: chunk.entryModule.moduleId,
          modules: chunk.modules
        });
      }
      this.emitAssets(file, source);
    }
  }

  /**
   * 
   * @param {*} file 文件
   * @param {*} source 生成代码
   */
  emitAssets (file, source) {
    this.assets[file] = source;
    this.files.push(file);
  }
}

module.exports = Compilation;