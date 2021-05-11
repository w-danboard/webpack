const NormalModule = require('./NormalModule');
class NormalModuleFactory {
  // 创建一个普通模块并返回
  create(data) {
    return new NormalModule(data);
  }
}

module.exports = NormalModuleFactory;