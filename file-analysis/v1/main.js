(function (modules) {
  // 模块缓存
  var installedModules = {};

  function __webpack_require__(moduleId) {
    // 检查模块是否在缓存中
    if (installedModules[moduleId]) {
      return installedModules[moduleId].exports;
    }
    // 创建一个新的模块，并放到缓存中
    var module = (installedModules[moduleId] = {
      i: moduleId,
      l: false,
      exports: {},
    });

    // 执行模块函数
    modules[moduleId].call(
      module.exports,
      module,
      module.exports,
      __webpack_require__
    );

    // 模块已加载成功
    module.l = true;

    // 返回此模块的导出对象
    return module.exports;
  }

  // 把modules对象放在__webpack_require__.m属性上
  __webpack_require__.m = modules;

  // 把模块的缓存对象放在__webpack_require__.c属性上
  __webpack_require__.c = installedModules;

  // 导出定义getter函数
  __webpack_require__.d = function (exports, name, getter) {
    if (!__webpack_require__.o(exports, name)) {
      Object.defineProperty(exports, name, { enumerable: true, get: getter });
    }
  };

  // 声明es6模块
  __webpack_require__.r = function (exports) {
    if (typeof Symbol !== 'undefined' && Symbol.toStringTag) {
      Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
    }
    Object.defineProperty(exports, '__esModule', { value: true });
  };

  // 包装es6模块
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

  // 获取默认导出的函数，为了兼容非harmony模块
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

  // Object.prototye.hasOwnProperty
  __webpack_require__.o = function (object, property) {
    return Object.prototype.hasOwnProperty.call(object, property);
  };

  // 把公开访问路径放在__webpack_require__.p属性上
  __webpack_require__.p = '';

   // 加载入口模块并且返回exports (__webpack_require__.s: 指定入口模块ID)
  return __webpack_require__((__webpack_require__.s = './src/index.js'));
})({
  './src/index.js': function (module, exports, __webpack_require__) {
    let title = __webpack_require__('./src/title.js');
    console.log(title);
  },

  './src/title.js': function (module, exports) {
    module.exports = '标题';
  },
});
