'use strict';

const path = require('path');

module.exports = {
  output: {
    path: path.resolve(__dirname, '../dist/main'),
    filename: '[name].js',
  },
  node: {
    __dirname: false,
    __filename: false,
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js', '.json'],
  },
  devtool: 'source-map',
  externals: (context, request, callback) => {
    callback(null, request.charAt(0) === '.' ? false : `require("${request}")`);
  },
};
