const path = require('path');
const mkdirP = require('mkdirP'); // 递归创建文件夹
const { Tapable, AsyncSeriesHook, SyncBailHook, AsyncParallelHook, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const Compilation = require('./Compilation');
const Stats = require('./Stats');

class Compiler extends Tapable {
  constructor (context) {
    super();
    this.context = context;
    this.hooks = {
      entryOption: new SyncBailHook(['context', 'entry']), // 在entry配置项处理过之后，执行插件
      beforeRun: new AsyncSeriesHook(['compiler']), // 执行之前
      run: new AsyncSeriesHook(['compiler']), // 启动一次新的编译
      beforeCompile: new AsyncSeriesHook(['params']), // 执行编译前
      compile: new SyncHook(['params']),  // 编译即将启动
      thisCompilation: new SyncHook(['compilation', 'params']), // 开始一次新的编译
      compilation: new SyncHook(['compilation', 'params']), // 创建完成一个新的compilation
      make: new AsyncParallelHook(['complation']), // make开始编译
      afterCompile: new AsyncSeriesHook(['compilation']), // 编译完成
      emit: new AsyncSeriesHook(['compilation']), // 生成资源到output目录之前
      done: new AsyncSeriesHook(['stats']) // 所有的编译全部都完成
    }
  }

  /**
   * 开始编译的入口
   * @param {*} callback 
   */
  run (callback) {
    // 最终的回调
    const onCompiled = (err, compilation) => {
      this.emitAssets(compilation, err => {
        let stats = new Stats(compilation); // 先收集编译信息 chunks entries moduels files...
        this.hooks.done.callAsync(stats, err => {
          callback(err, stats);
        });
      });
    }
    // 执行之前
    this.hooks.beforeRun.callAsync(this, err => {
      // 启动一次新的编译
      this.hooks.run.callAsync(this, err => {
        this.compile(onCompiled);
      });
    });
  }

  /**
   * 编译
   * @param {*} onCompiled 最终的回调
   */
  compile (onCompiled) {
    const params = this.newCompilationParams(); // Compilation对象参数
    this.hooks.beforeCompile.callAsync(params, err => {
      this.hooks.compile.call(params);
      // 创建一个新的compilation对象
      const compilation = this.newCompilation(params);
      // 触发make钩子的回调函数执行
      this.hooks.make.callAsync(compilation, err => {
        // 封装代码
        compilation.seal(err => {
          // 触发编译完成的钩子
          this.hooks.afterCompile.callAsync(compilation, err => {
            onCompiled(err, compilation);
          })
        });
      });
    })
  }

  newCompilationParams () {
    const params = {
      normalModuleFactory: new NormalModuleFactory() // 创建compilation之前，先创建普通模块工厂
    };
    return params;
  }

  newCompilation (params) {
    const compilation = this.createCompilation(); // 创建Compilation对象
    this.hooks.thisCompilation.call(compilation, params); // 开始一次新的编译
    this.hooks.compilation.call(compilation, params); // 创建完成一个新的compilation
    return compilation;
  }

  createCompilation () {
    return new Compilation(this);
  }

  emitAssets (compilation, callback) {
    // 把chunk文件写入硬盘
    const emitFiles = (err) => {
      const assets = compilation.assets;
      let outputPath = compilation.options.output.path; // path.resolve(__dirname, 'dist')
      for (let file in assets) {
        let source = assets[file];
        // 输出文件的绝对路径
        let targetPath = path.posix.join(outputPath, file);
        this.outputFileSystem.writeFileSync(targetPath, source, 'utf8');
      }
      callback();
    };
    // 触发emit钩子，这个钩子貌似在写插件的时候用的很多，修改输出内容的最后机会了...
    this.hooks.emit.callAsync(compilation, err => {
      // 先创建输出目录dist，在写入文件
      mkdirP(this.options.output.path).then(made => {
        emitFiles()
      });
    })
  }
}                                                                                  
                                                                                                                                                                                                                                                                                              
module.exports = Compiler;