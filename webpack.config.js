const path = require('path');

module.exports = {
  context: process.cwd(), // 当前工作目录
  mode: 'development',
  devtool: 'none',
  entry: './src/index.js',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'main.js',
    chunkFilename: '[name].js'
  }
}