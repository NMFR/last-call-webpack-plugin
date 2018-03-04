var values = require('lodash/values');

var projectPath = __dirname;
var buildPath = projectPath + '/dist';

var Webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LastCallWebpackPlugin = require('../');
var cssnano = require('cssnano');

var globalVarPlugin = new Webpack.DefinePlugin({
  'process.env': {
    'NODE_ENV': JSON.stringify(process.env.NODE_ENV),
  },
});

var entry = {
  app: './app.js',
};

var plugins = [
  globalVarPlugin,
  new ExtractTextPlugin('[name].css', { allChunks: true }),
  new LastCallWebpackPlugin({
    assetProcessors: [
      ...values(LastCallWebpackPlugin.PHASES)
        .map(phase => ({
            regExp: /\.css$/g,
            processor: (assetName, asset) =>
              Promise.resolve(`/* Prefix CSS Comment ${phase} */\n` + asset.source()),
            phase,
          })
        ),
      ...values(LastCallWebpackPlugin.PHASES)
        .map(phase => ({
            regExp: /\.js$/g,
            processor: (assetName, asset) =>
              Promise.resolve(`// Prefix JS Comment ${phase} \n` + asset.source()),
            phase,
          })
        ),
    ],
    canPrint: true
  })
];

const PHASES = {
  OPTIMIZE_CHUNK_ASSETS: 'compilation.optimize-chunk-assets',
  OPTIMIZE_ASSETS: 'compilation.optimize-assets',
  EMIT: 'emit'
};

module.exports = {
  devtool: "source-map",
  context: projectPath + '/',
  entry: entry,
  output: {
    filename: 'app.js',
    path: buildPath,
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        loader: ExtractTextPlugin.extract('css-loader?&discardDuplicates&discardComments&sourceMap'),
      },{
        test: /\.png$/,
        loader: 'file-loader'
      }
    ]
  },
  plugins: plugins,
};
