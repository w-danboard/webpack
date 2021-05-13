(function (modules) {

  // 已经安装过的代码块ID 0表示已加载成功(指的main代码块加载完成了)
  let installedChunks = { main: 0 };

  function webpackJsonpCallback (data) {
    let [chunkIds, moreModules] = data;
    let resolves = [];
    for (let i = 0; i < chunkIds.length; i++) {
      let chunkId = chunkIds[i]; // title
      let installedChunkData = installedChunks[chunkIds]; // [resolve, reject, promise]
      let resolve = installedChunkData[0]
      resolves.push(resolve); // 把promise的resolve方法放到resolves数组里去了
      // 只要说此代码块的代码已经加载回来了那就是成功了
      installedChunks[chunkId] = 0; // 标志这个代码块已经加载成功了
    }
    // 把异步加载过来的代码块里面的模块合并到modules上面去
    for (let moduleId in moreModules) {
      modules[moduleId] = moreModules[moduleId];
    }

    // resolve一旦执行就意味着promise变成了成功态
    resolves.forEach(resolve => resolve());
  };

  function require (moduleId) {
    let module = {
      i: moduleId,
      exports: {}
    };
    modules[moduleId](module, module.exports, require);
    return module.exports;
  }

  require.e = function (chunkId) {
    let installedChunkData;
    let promise = new Promise(function (resolve, reject) {
      installedChunkData = [resolve, reject];
    });
    installedChunkData.push(promise); // [resolve, reject, promise]
    installedChunks[chunkId] = installedChunkData;

    let script = document.createElement('script');
    script.src = chunkId + '.js';
    document.head.appendChild(script);
    return promise;
  };
  require.t = function (value, mode) {
    // mode=7 0b0111
    if (mode & 0b0001) {
      // 如果为ture, 说明这个value是一个模块ID，需要require加载
      value = require(value)
    }
    // 下面逻辑，就是把不管是common.js模块还是es6模块，都变成es6模块
    let ns = Object.create(null);
    ns.__esModule = true;
    ns.default = value; // ns.default指向原来的导出对象
    for (let key in value) {
      // 把value上的属性全部合并到ns对象上，为了取值方便，不需要ns.default.xxx ns.xxx
      ns[key] = value[key]
    }
    return ns; // 包装后的对象
  };
  window['webpackJsonp'] = [];
  let jsonArray = window['webpackJsonp'];
  // 重写push方法
  jsonArray.push = webpackJsonpCallback;

  return require('./src/index.js');
})({
  // main代码块对应的代码
  './src/index.js': function (module, exports, require) {
    let importBtn = document.getElementById('import');
    importBtn.addEventListener('click', () => {
      require
        .e('title')
        .then(function () {
          return require.t('./src/title.js', 7);
        })
        .then(result => {
          console.log(result);
        })
    });
  }
});