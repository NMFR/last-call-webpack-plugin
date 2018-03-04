# Last Call Webpack Plugin

A Webpack plugin that allows you to transform \ modify assets just before Webpack emits them.

## What does the plugin do?

It allows you to transform \ modify Webpack assets just before Webpack emits them (writes them to files or memory in case you are using something like Webpack dev server).

It can be used for example to:
* Prefix a ``` /* Author: John Doe */ ``` comment on all the .js files Webpack generates.
* Run some final optimization on all .css files Webpack generates.

## Installation:

Using npm:
```shell
$ npm install --save-dev last-call-webpack-plugin
```

## Configuration:

The plugin can receive the following options:
* assetProcessors: An Array of objects that describe asset processors:
  * regExp: A regular expression to match the asset name that the processor handles.
  * processor: A function with the signature of ``` function(assetName, webpackAssetObject) ``` that returns a Promise. If the Promise returns a result this result will replace the assets content.
  * phase: The webpack compilation phase that at which the processor should be called. Default value is `compilation.optimize-assets`. Can be one of the following values:
    * `compilation.optimize-chunk-assets`
    * `compilation.optimize-assets`
    * `emit`
* onStart: A function with the signature of ``` function(assets, assetsAndProcessors, webpackCompilationObject) ``` that will be called before the plugin starts calling the assets processors.
* onEnd: A function with the signature of ``` function(error) ``` that will be called after the plugin calls all the assets processors. If no errors occurred the ``` error ``` parameter will be undefined.
* canPrint: A boolean indicating if the plugin can print messages to the console, defaults to `true`.

Note: An environment supporting Promises or a Promise polyfill is needed for this plugin to be used.

## Example:

``` javascript
var cssnano = require('cssnano');
var LastCallWebpackPlugin = require('last-call-webpack-plugin');
module.exports = {
  module: {
    loaders: [
      { test: /\.css$/, loader: ExtractTextPlugin.extract("style-loader", "css-loader") }
    ]
  },
  plugins: [
    new ExtractTextPlugin("styles.css"),
    new LastCallWebpackPlugin({
      assetProcessors: [{
        regExp:  /\.js$/,
        processor: (assetName, asset) => Promise.resolve('// Author: John Doe \n' + asset.source())
      }, {
				regExp:  /\.css$/,
        processor: (assetName, asset) => cssnano.process(asset.source())
          .then(r => r.css)
      }],
      onStart: () => console.log('Starting to process assets.'),
      onEnd: (err) => console.log(err ? 'Error: ' + err : 'Finished processing assets.'),
      canPrint: true
    })
	]
}
```

## License

MIT (http://www.opensource.org/licenses/mit-license.php)