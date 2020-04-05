require('dotenv').config();

// Reference: https://github.com/sveltejs/template-webpack
//

const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');

const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

module.exports = {
  entry: {
    bundle: ['./src/liff/index.js'],
  },
  resolve: {
    alias: {
      svelte: path.resolve('node_modules', 'svelte'),
    },
    extensions: ['.mjs', '.js', '.svelte'],
    mainFields: ['svelte', 'browser', 'module', 'main'],
  },
  output: {
    path: __dirname + '/liff',
    filename: '[name].[hash].js',
    chunkFilename: '[name].[id].js',
  },
  module: {
    rules: [
      {
        test: /\.svelte$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              plugins: [
                [
                  'ttag',
                  {
                    resolve: {
                      translations: path.resolve(__dirname, './i18n/zh_TW.po'),
                    },
                  },
                ],
              ],
            },
          },
          {
            loader: 'svelte-loader',
            options: {
              emitCss: true,
              hotReload: !prod,
            },
          },
        ],
      },
      {
        test: /\.css$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
        ],
      },
    ],
  },
  mode,
  plugins: [
    new MiniCssExtractPlugin({
      filename: '[name].[hash].css',
    }),
    new HtmlWebpackPlugin({
      inject: true,
      template: './src/liff/index.html',
    }),
    new CompressionPlugin(),
  ],
  devtool: prod ? false : 'source-map',

  devServer: {
    port: process.env.LIFF_DEV_PORT,
  },
};
