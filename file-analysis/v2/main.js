(function (modules) {
  // 安装一个JSONP callback为了加载额外的代码块
  function webpackJsonpCallback(data) {
    var chunkIds = data[0]; // chunkIdss数组
    var moreModules = data[1]; // 额外的代码块

    // 给modules对象上添加额外的模块
    // 然后把所有的代码块ID设置为已经加载成功，并且让promise编程成功态，并且触发回调
    var moduleId,
      chunkId,
      i = 0,
      resolves = [];
    for (; i < chunkIds.length; i++) {
      chunkId = chunkIds[i];
      if (
        Object.prototype.hasOwnProperty.call(installedChunks, chunkId) &&
        installedChunks[chunkId]
      ) {
        // installedChunks[chunkId]=[resolve,reject,promise]
        resolves.push(installedChunks[chunkId][0]); // resolves.push(resolve)
      }
      installedChunks[chunkId] = 0; // 表示已经加载成功了
    }
    // 把moreModules上面的属性都合并到modules上面去
    for (moduleId in moreModules) {
      if (Object.prototype.hasOwnProperty.call(moreModules, moduleId)) {
        modules[moduleId] = moreModules[moduleId];
      }
    }
    // 调用一下parentJsonpFunction jsonpArray.push(data)
    if (parentJsonpFunction) parentJsonpFunction(data);

    while (resolves.length) {
      resolves.shift()(); // 取出第一个依次执行

      /**
       * let resolve = resolves.shift()
       * resolve()
       */
    }
  }

  // The module cache
  var installedModules = {};

  // 这是一个对象，用来存放加载过的和加载中的代码块集合
  // 如果值是undefined的话，说明代码块从未加载
  // null 预加载或者说预获取
  // Promise 此代码块正在加载中
  // 0 此代码块已经加载
  var installedChunks = {
    main: 0,
  };

  // script path function
  function jsonpScriptSrc(chunkId) {
    return (
      __webpack_require__.p +
      '' +
      ({ title: 'title' }[chunkId] || chunkId) +
      '.js'
    );
  }

  // The require function
  function __webpack_require__(moduleId) {
    // Check if module is in cache
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // Create a new module (and put it into the cache)
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // Execute the module function
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    // Flag the module as loaded
    module.l = true;

    // Return the exports of the module
    return module.exports;
  }

  // 懒加载额外的代码块
  // 这个文件只把汗入口代码块
  // 代码块加载函数可以用来加载额外的，分割出去的代码
  __webpack_require__.e = function requireEnsure(chunkId) {
    var promises = [];

    // 使用JSONP来加载额外的代码块
    var installedChunkData = installedChunks[chunkId]; // undefined
    if (installedChunkData !== 0) {
      // 未加载成功的话

      // 说明这是个Promise，表示此代码块正在加载中
      if (installedChunkData) {
        // 再看看这个installedChunkData是不是undefined
        promises.push(installedChunkData[2]); // 把这个promise放在数组中等一等
      } else {
        // 开始创建Promise准备加载数据
        var promise = new Promise(function (resolve, reject) {
          installedChunkData = installedChunks[chunkId] = [resolve, reject];
        });
        promises.push((installedChunkData[2] = promise));

        // 开始代码块的加载了
        var script = document.createElement('script');
        var onScriptComplete;

        script.charset = 'utf-8'; // 指定编码
        script.timeout = 120; // 指定超市时间
        // if (__webpack_require__.nc) {
        //   script.setAttribute('nonce', __webpack_require__.nc);
        // }
        script.src = jsonpScriptSrc(chunkId); // chunkId是title.js

        // create error before stack unwound to get useful stacktrace later
        var error = new Error();
        onScriptComplete = function (event) {
          // avoid mem leaks in IE.
          script.onerror = script.onload = null;
          clearTimeout(timeout);
          var chunk = installedChunks[chunkId];
          if (chunk !== 0) {
            if (chunk) {
              var errorType =
                event && (event.type === 'load' ? 'missing' : event.type);
              var realSrc = event && event.target && event.target.src;
              error.message =
                'Loading chunk ' +
                chunkId +
                ' failed.\n(' +
                errorType +
                ': ' +
                realSrc +
                ')';
              error.name = 'ChunkLoadError';
              error.type = errorType;
              error.request = realSrc;
              chunk[1](error);
            }
            installedChunks[chunkId] = undefined;
          }
        };
        var timeout = setTimeout(function () {
          onScriptComplete({ type: 'timeout', target: script });
        }, 120000);
        script.onerror = script.onload = onScriptComplete;
        document.head.appendChild(script);
      }
    }
    return Promise.all(promises);
  };

  // expose the modules object (__webpack_modules__)
  __webpack_require__.m = modules;

  // expose the module cache
  __webpack_require__.c = installedModules;

  // define getter function for harmony exports
  __webpack_require__.d = function (exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // define __esModule on exports
  __webpack_require__.r = function (exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  __webpack_require__.t = function (value, mode) {
    if (mode & 1) value = __webpack_require__(value);
    if (mode & 8) return value;
    if (mode & 4 && typeof value === 'object' && value && value.__esModule)
      return value;
    var ns = Object.create(null);
    __webpack_require__.r(ns);
    Object.defineProperty(ns, 'default', { enumerable: true, value: value });
    if (mode & 2 && typeof value != 'string')
      for (var key in value)
        __webpack_require__.d(
          ns,
          key,
          function (key) {
            return value[key];
          }.bind(null, key)
        );
    return ns;
  };

  // getDefaultExport function for compatibility with non-harmony modules
  __webpack_require__.n = function (module) {
    var getter =
      module && module.__esModule
        ? function getDefault() {
            return module['default'];
          }
        : function getModuleExports() {
            return module;
          };
    __webpack_require__.d(getter, 'a', getter);
    return getter;
  };

  // Object.prototype.hasOwnProperty.call
  __webpack_require__.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // __webpack_public_path__
  __webpack_require__.p = '';

  // on error function for async loading
  __webpack_require__.oe = function (err) {
    console.error(err);
    throw err;
  };

  // 第一步让window['webpackJsonp']等于一个空数组
  var jsonpArray = (window['webpackJsonp'] = window['webpackJsonp'] || []); // 把数组的push方法绑定this死了为数组
  // 让它等于数组的老的push方法
  var oldJsonpFunction = jsonpArray.push.bind(jsonpArray); // 让数组的push方法重新赋值 为webpackJsonpCallback
  jsonpArray.push = webpackJsonpCallback;
  jsonpArray = jsonpArray.slice();
  for (var i = 0; i < jsonpArray.length; i++)
    webpackJsonpCallback(jsonpArray[i]);
  var parentJsonpFunction = oldJsonpFunction; // 等于老的push方法

  // Load entry module and return exports
  return __webpack_require__((__webpack_require__.s = './src/index.js'));
})({
  './src/index.js': function (module, exports, __webpack_require__) {
    let importBtn = document.getElementById('import');
    importBtn.addEventListener('click', () => {
      // 关键是这里
      // 其实下面代码就是 import('./title')
      __webpack_require__
        .e('title')
        .then(
          __webpack_require__.t.bind(null, /*! ./title */ './src/title.js', 7)
        )
        .then((result) => {
          // result就是这个title的导出对象
          console.log(result);
        });
    });
  },
});
