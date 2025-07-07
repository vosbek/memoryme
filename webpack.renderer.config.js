const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = (env, argv) => {
  const isDevelopment = argv.mode === 'development';

  return {
    target: 'electron-renderer',
    entry: './src/renderer/index.tsx',
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: 'renderer.js',
      publicPath: isDevelopment ? 'http://localhost:3000/' : './',
    },
    resolve: {
      extensions: ['.tsx', '.ts', '.js', '.jsx'],
      alias: {
        '@': path.resolve(__dirname, 'src'),
      },
      fallback: {
        "global": require.resolve("global/window"),
        "buffer": require.resolve("buffer"),
        "process": require.resolve("process/browser"),
        "path": require.resolve("path-browserify"),
        "fs": false,
        "crypto": require.resolve("crypto-browserify"),
        "stream": require.resolve("stream-browserify"),
        "util": require.resolve("util"),
        "url": require.resolve("url"),
        "querystring": require.resolve("querystring-es3")
      },
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: 'ts-loader',
          exclude: /node_modules/,
        },
        {
          test: /\.css$/,
          use: [
            'style-loader',
            'css-loader',
            'postcss-loader',
          ],
        },
        {
          test: /\.(png|jpg|jpeg|gif|svg)$/,
          type: 'asset/resource',
        },
      ],
    },
    plugins: [
      new HtmlWebpackPlugin({
        template: './src/renderer/index.html',
        filename: 'index.html',
      }),
      new (require('webpack').ProvidePlugin)({
        global: 'global/window',
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    ],
    devServer: {
      port: 3000,
      hot: true,
      static: {
        directory: path.join(__dirname, 'dist'),
      },
    },
    devtool: isDevelopment ? 'eval-source-map' : 'source-map',
  };
};