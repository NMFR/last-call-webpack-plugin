var projectPath = __dirname;
var buildPath = projectPath + '/dist';

var Webpack = require('webpack');
var ExtractTextPlugin = require('extract-text-webpack-plugin');
var LastCallWebpackPlugin = require('../index.js');
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
  new Webpack.optimize.CommonsChunkPlugin({
    name: 'library',
    filename: 'library.js'
  }),
  new ExtractTextPlugin('[name].css', { allChunks: true }),
  new LastCallWebpackPlugin({
    assetProcessors: [
      {
        regExp: /\.css$/g,
        processor: (assetName, asset) => cssnano.process(asset.source(), Object.assign({ to: assetName })).then(r => '// Prefix CSS Comment \n' + r.css),
      }, {
        regExp: /\.js$/g,
        processor: (assetName, asset) => Promise.resolve('// Prefix JS Comment \n' + asset.source()),
      }
    ],
    onStart: () => console.log('Starting'),
    onEnd: () => console.log('Ended'),
    canPrint: true
  })
];

module.exports = {
  devtool: "source-map",
  context: projectPath + '/',
  entry: entry,
  output: {
    filename: 'app.js',
    path: buildPath,
  },
  module: {
    loaders: [{
      test: /\.css$/,
      loader: ExtractTextPlugin.extract('css-loader?&discardDuplicates&discardComments&sourceMap'),
    },{
      test: /\.png$/,
      loader: 'file-loader'
    }]
  },
  plugins: plugins,
};
