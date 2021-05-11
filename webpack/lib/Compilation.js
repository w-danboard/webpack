const path = require('path');
let async = require('neo-async');
const { Tapable, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const normalModuleFactory = new NormalModuleFactory();
const Chunk = require('./Chunk');
const ejs = require('ejs');
const fs = require('fs');
const mainTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'asyncMain.ejs'), 'utf8');
const mainRender = ejs.compile(mainTemplate); // 模板经过编译会返回一个函数，向里面传参即可
const chunkTemplate = fs.readFileSync(path.join(__dirname, 'templates', 'chunk.ejs'), 'utf8');
const chunkRender = ejs.compile(chunkTemplate); // 模板经过编译会返回一个函数，向里面传参即可

// 所有模块共享一个Parser
const Parser = require('./Parser');
let parser = new Parser();
class Compilation extends Tapable {
  constructor (compiler) {
    super();
    this.compiler = compiler; // 编译器对象
    this.options = compiler.options; // 选项一样
    this.context = compiler.context; // 根目录
    /**
     * 为啥不是直接在这个文件引入fs直接使用 而是利用inputFileSystem呢？
     * 答：为了灵活，可配置。因为在热更新的时候，读文件写文件用的是(迈瑞fs。。。)
     */
    this.inputFileSystem = compiler.inputFileSystem; // 读取文件模块fs
    this.outputFileSystem = compiler.outputFileSystem; // 写入文件的模块fs
    this.entries = []; // 入口的数组， 这里放着所有的入口模块
    this.modules = []; // 模块的数组， 这里放着所有的模块
    this.chunks = []; // 这里放着所有的代码块
    this.files = []; // 这里放着本次编译所有产出的文件名
    this.assets = {}; // 存放着生成资源 key是文件名 值是文件的内容
    this.hooks = {
      // 当你成功构建完成一个模块后就会触发此钩子
      succeedModule: new SyncHook(['module']),
      seal: new SyncHook(),
      beforeChunks: new SyncHook(),
      afterChunks: new SyncHook()
    }
  }

  /**
   * 开始编译一个新的入口
   * @param {*} context 根目录
   * @param {*} entry 入口模块的相对路径 ./src/index.js
   * @param {*} name 入口的名字 main
   * @param {*} callback 编译完成的回调
   */
  addEntry (context, entry, name, finalCallback) {
    this._addModuleChain(context, entry, name, false, (err, module) => {
      finalCallback(err, module);
    });
  }

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
   * 创建并编译一个模块  源码里写了两边，我们为了方便就写一遍
   * @param {*} data 要编译的模块信息
   * @param {*} addEntry 可选的增加入口的方法，如果这个模块是入口模块就添加到entries里，如果不是就不做了
   * @param {*} callback 编译完成之后可以调用callback回调
   */
  createModule (data, addEntry, callback) { 
    // 通过模块工厂 创建一个模块
    let module = normalModuleFactory.create(data);
    module.moduleId = './' + path.posix.relative(this.context, module.resource); // ./src/index.js
    addEntry && addEntry(module); // 如果是入口模块。则添加到入口里去
    // this.entries.push(entryModule); // 给入口模块数组添加一个模块
    this.modules.push(module); // 给普通模块数组添加一个模块
    const afterBuild = (err, module) => {
      // 编译依赖的模块, 如果大于0说明有依赖
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
   * 处理编译模块依赖
   * @param {*} module  ./src/index.js
   * @param {*} callback 
   */
  processModuleDependencies (module, callback) {
    // 1. 获取当前模块的依赖模块
    let dependencies = module.dependencies;
    // 遍历依赖模块，全部开始编译，当所有的依赖模块全部编译完成之后，才调用这个callback
    async.forEach(dependencies, (dependency, done) => {
       let { name, context, rawRequest, resource, moduleId } = dependency;
       this.createModule({
          name,
          context,
          rawRequest,
          parser,
          resource,
          moduleId
        }, null, done); // 不是入口模块，传null就可以了
    }, callback)
  }

  /**
   * 编译模块
   * @param {*} module 要编译的模块
   * @param {*} afterBuild 编译完成后的回调
   */
  buildModule (module, afterBuild) {
    /**
     * 模块的真正编译逻辑其实是放在module内部完成
     *  模块是这么编译的？
     *  1.先去读取源文件
     *  2.读完之后，走loader配置
     *  3.走完之后得到js模块，把js模块转为语法树
     *  4.最后去编译依赖？？？
     */
    // 会调用模块自己的build方法
    module.build(this, err => {
      // 走到这里意味着一个module模块已经编译完成了
      this.hooks.succeedModule.call(module);
      afterBuild(err, module)
    })
  }

  /**
   * 把模块封装成代码块Chunk
   * @param {*} callback 
   */
  seal (callback) {
    this.hooks.seal.call();
    this.hooks.beforeChunks.call(); // 开始准备生成代码块
    // 一般来说，默认情况下，每一个入口会生成一个代码块
    for (const entryModule of this.entries) {
      const chunk = new Chunk(entryModule); // 根据入口模块得到一个代码块
      this.chunks.push(chunk);
      // 对所有的模块进行过滤，找出来哪些名称跟这个chunk一样的模块，然后组成一个数据赋给chunk.modules
      chunk.modules = this.modules.filter(module => module.name === chunk.name);
    }
    this.hooks.afterChunks.call(this.chunks);
    // 生成代码块之后，要生成代码块对应的资源
    this.createChunkAssets();
    callback();
  }

  createChunkAssets () {
    for (let i = 0; i < this.chunks.length; i++) {
      const chunk = this.chunks[i];
      chunk.files = [];
      const file = chunk.name + '.js'; // 只是拿到了文件名
      chunk.files.push(file);
      let source;
      if (chunk.async) {
        // 异步代块
        source = chunkRender({
          chunkName: chunk.name, // ./src.index.js
          modules: chunk.modules // 此代码块对应的模块数组 [{moduleId: './src/index.js'}, {moduleId: './src/title.js'}]
        });
      } else {
        // 同步代码块
        source = mainRender({
          entryModuleId: chunk.entryModule.moduleId, // ./src.index.js
          modules: chunk.modules // 此代码块对应的模块数组 [{moduleId: './src/index.js'}, {moduleId: './src/title.js'}]
        });
      }
      this.emitAssets(file, source);
    }
  }

  emitAssets (file, source) {
    this.assets[file] = source;
    this.files.push(file);
  }
}

module.exports = Compilation;