const NormalModule = require('./NormalModule');

// 模块工厂
class NormalModuleFactory {
  create(data) {
    return new NormalModule(data);
  }
}

module.exports = NormalModuleFactory;