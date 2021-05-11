const { Tapable, AsyncSeriesHook, SyncBailHook, AsyncParallelHook, SyncHook } = require('tapable');
const NormalModuleFactory = require('./NormalModuleFactory');
const Compilation = require('./Compilation');
const Stats = require('./Stats');
const mkdirP = require('mkdirP'); // 递归创建文件夹
const path = require('path');
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

  emitAssets (compilation, callback) {
    // finalCallback(err, new Stats(compilation));
    // 把chunk编程文件，写入硬盘
    const emitFiles = (err) => {
      const assets = compilation.assets;
      let outputPath = compilation.options.output.path; // dist
      for (let file in assets) {
        let source = assets[file];
        // 是输出文件的绝对路径
        let targetPath = path.posix.join(outputPath, file);
        this.outputFileSystem.writeFileSync(targetPath, source, 'utf8');
      }
      callback();
    };
    // 先触发emit的回调，在写插件的时候，emit这个钩子用的很多，因为它是我们修改输入内容的最后机会
    this.hooks.emit.callAsync(compilation, err => {
      // 先创建输出目录dist，在写入文件
      mkdirP(this.options.output.path).then(made => {
        console.log('made ===>')
        emitFiles()
      });
    })
  }

  // run方法是开始编译的入口
  run (callback) {
    console.log('Compiler run');
    const onCompiled = (err, compilation) => {
      // console.log('onCompiled');
      this.emitAssets(compilation, err => {
        // 先收集编译信息 chunks entries moduels files
        let stats = new Stats(compilation);
        // 再触发done这个钩子执行
        this.hooks.done.callAsync(stats, err => {
          callback(err, stats);
        });
      });
    }
    this.hooks.beforeRun.callAsync(this, err => {
      this.hooks.run.callAsync(this, err => {
        this.compile(onCompiled);
      });
    });
  }

  compile (onCompiled) {
    const params = this.newCompilationParams();
    this.hooks.beforeCompile.callAsync(params, err => {
      this.hooks.compile.call(params);
      // 创建一个新的compilation对象
      const compilation = this.newCompilation(params);
      // 触发make钩子的回调函数执行
      this.hooks.make.callAsync(compilation, err => {
        // console.log('make完成');
        // 封装代码块之后编译就完成了
        compilation.seal(err => {
          // 触发编译完成的钩子
          this.hooks.afterCompile.callAsync(compilation, err => {
            onCompiled(err, compilation);
          })
        });
        // onCompiled(null, compilation);
      });
    })
  }

  createCompilation () {
    return new Compilation(this);
  }

  newCompilation (params) {
    const compilation = this.createCompilation();
    this.hooks.thisCompilation.call(compilation, params);
    this.hooks.compilation.call(compilation, params);
    return compilation;
  }

  newCompilationParams () {
    const params = {
      // 在创建compilation之前，已经创建了一个普通模块工厂
      normalModuleFactory: new NormalModuleFactory()
    };
    return params;
  }
}                                                                                  
                                                                                                                                                                                                                                                                                              
module.exports = Compiler;

/**
 * Compiler是单例的，不管编译多少次，Compiler都只有一个
 * 
 * - 第一次，源码改变之后，都会创建新的Compilation
 * - ./src/index.js [Compilation开始编译入口文件，根据入口文件找到所有的依赖文件，封装成一个叫main的代码块chunk]
 * - 根据这个chunk生成一个文件 [main.js 包括入口文件以及所有入口文件依赖模块]
 * 
 * chunk是一个对象
 */