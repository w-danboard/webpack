let fs = require('fs');

class NodeEnvironmentPlugin {
  constructor (options) {
    this.options = options || {};
  }

  apply (compiler) {
    // 其实就是fs，做了一些增强。找文件的时候会有一些额外的逻辑。比如读resolve...
    compiler.inputFileSystem = fs; // 读取文件用哪个模块 fs.readFile
    compiler.outputFileSystem = fs; // 写文件用哪个模块 fs.writeFile
  }
}

module.exports = NodeEnvironmentPlugin;