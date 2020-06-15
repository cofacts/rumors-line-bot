require('dotenv').config();

// Webpack config for LIFF
//
// Reference:
// https://github.com/sveltejs/template-webpack
// https://github.com/hperrin/smui-example-webpack/blob/master/webpack.config.js

const { DefinePlugin } = require('webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CompressionPlugin = require('compression-webpack-plugin');
const TerserPlugin = require('terser-webpack-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');

const path = require('path');

const mode = process.env.NODE_ENV || 'development';
const prod = mode === 'production';

const babelLoaderConfig = {
  loader: 'babel-loader',
  options: {
    presets: [
      [
        '@babel/preset-env',
        {
          targets: {
            // https://g0v.hackmd.io/pDyGj-w0QPWKdV2gp2h9LQ#LIFF-compatibility
            ios: '10',
            android: '52',
          },
          useBuiltIns: 'entry',
          corejs: 3,
        },
      ],
    ],
  },
};

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
        test: /\.js$/,
        exclude: [
          // As long as we use useBuiltIns: 'entry' in preset-env, we don't need to process node_modules.
          // All polyfills are included by `import 'core-js'` statement in liff/index.
          path.resolve(__dirname, 'node_modules'),
        ],
        use: [babelLoaderConfig],
      },
      {
        test: /\.svelte$/,
        use: [
          babelLoaderConfig,
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
        test: /\.scss$/,
        use: [
          /**
           * MiniCssExtractPlugin doesn't support HMR.
           * For developing, use 'style-loader' instead.
           * */
          prod ? MiniCssExtractPlugin.loader : 'style-loader',
          'css-loader',
          {
            loader: 'sass-loader',
            options: {
              sassOptions: {
                // Process svelte-material-ui SCSS files in node_modules as well
                includePaths: ['./node_modules', './src/liff'],
              },
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
      // custom constants passed to index.html via htmlWebpackPlugin.options
      ROLLBAR_ENV: process.env.ROLLBAR_ENV,
      ROLLBAR_CLIENT_TOKEN: process.env.ROLLBAR_CLIENT_TOKEN,
    }),
    new CompressionPlugin(),
    new DefinePlugin({
      LIFF_ID: JSON.stringify(
        (process.env.LIFF_URL || '').replace('https://liff.line.me/', '')
      ),
      APP_ID: JSON.stringify(process.env.APP_ID),
      DEBUG_LIFF: process.env.DEBUG_LIFF,
      COFACTS_API_URL: JSON.stringify(process.env.API_URL),
    }),
  ],
  devtool: prod ? false : 'source-map',
  optimization: {
    minimize: prod,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // We are supporting iOS 7, which uses Safari 10 by default.
          // Solves "Cannot declare a let variable twice".
          safari10: true,
        },
      }),
      new OptimizeCSSAssetsPlugin(),
    ],
  },

  devServer: {
    port: process.env.LIFF_DEV_PORT,
    publicPath: '/liff/',

    // Browserstack is having issue testing iOS on localhost domain, use ngrok instead:
    // https://www.browserstack.com/question/663
    //
    // Disable host name check to enable ngrok:
    // https://github.com/webpack/webpack-dev-server/issues/1604#issue-393549402
    //
    disableHostCheck: true,
  },
};
