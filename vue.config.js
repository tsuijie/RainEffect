const path = require('path');

module.exports = {
  productionSourceMap: false,
  chainWebpack: (config) => {
    config.resolve.alias.set('@', path.join(__dirname, 'src'))
  },
  configureWebpack: (config) => {
    config.module.rules.push({
      test: /\.(glsl|frag|vert)$/,
      exclude: /node_modules/,
      use: [
        'raw-loader',
        {
          loader: 'glslify-loader',
        }
      ]
    })
  }
};