var _ = require('underscore');
var webpackSources = require('webpack-sources');

function emptyFunc() {};

function LastCallWebpackPlugin(options) {
  this.options = _.assign(
    {
      assetProcessors: [],
      onStart: emptyFunc,
      onEnd: emptyFunc,
      canPrint: true
    },
    options || {}
  );

  if (!_.isArray(this.options.assetProcessors)) {
    throw new Error('LastCallWebpackPlugin Error: invalid options.assetProcessors (must be an Array).');
  }

  _.each(this.options.assetProcessors, function (processor, index) {
    if (!processor) {
      throw new Error('LastCallWebpackPlugin Error: invalid options.assetProcessors[' + String(index) + '] (must be an object).');
    }
    if (!_.isRegExp(processor.regExp)) {
      throw new Error('LastCallWebpackPlugin Error: invalid options.assetProcessors[' + String(index) + '].regExp (must be an regular expression).');
    }
    if (!_.isFunction(processor.processor)) {
      throw new Error('LastCallWebpackPlugin Error: invalid options.assetProcessors[' + String(index) + '].processor (must be a function).');
    }
  });

  if (!_.isFunction(this.options.onStart)) {
    throw new Error('LastCallWebpackPlugin Error: invalid options.onStart (must be a function).');
  }
  if (!_.isFunction(this.options.onEnd)) {
    throw new Error('LastCallWebpackPlugin Error: invalid options.onEnd (must be a function).');
  }
};

LastCallWebpackPlugin.prototype.print = function() {
  if (this.options.canPrint) {
    console.log.apply(console, arguments);
  }
};

LastCallWebpackPlugin.prototype.onAssetError = function(assetName, asset, err) {
  this.print('Error processing file: ' + assetName);
};

LastCallWebpackPlugin.prototype.getAssetsAndProcessors = function(assets) {
  var assetProcessors = this.options.assetProcessors;
  var assetNames = _.keys(assets);
  var assetsAndProcessors = [];

  _.each(assetNames, function (assetName) {
    _.each(assetProcessors, function(assetProcessor) {
      var regExpResult = assetProcessor.regExp.match(assetName);
      if (regExpResult) {
        var assetAndProcessor = {
          assetName: assetName,
          regExp: assetProcessor.regExp,
          processor: assetProcessor.processor,
          regExpResult: regExpResult,
        };
        assetsAndProcessors.push(assetAndProcessor);
      }
    });
  });

  return assetsAndProcessors;
};

LastCallWebpackPlugin.prototype.createAsset = function(content, originalAsset) {
  return new webpackSources.RawSource(content);
};

LastCallWebpackPlugin.prototype.apply = function(compiler) {
  var self = this;

  compiler.plugin('emit', function(compilation, compileCallback) {
    var assets = compilation.assets;
    var assetsAndProcessors = self.getAssetsAndProcessors(assets);

    self.options.onStart(assets, assetsAndProcessors, compilation);

    var hasErrors = false;
    var promises = [];

    _.each(assetsAndProcessors, function(assetAndProcessor) {
      var asset = assets[assetAndProcessor.assetName];
      var promise = assetAndProcessor.processor(assetAndProcessor.assetName, asset)
        .then(function (result) {
          if (!hasErrors) {
            if (result !== undefined) {
              assets[assetAndProcessor.assetName] = self.createAsset(result, asset);
            }
          }
        })
        .catch(function(err) {
          hasErrors = true;
          self.onAssetError(assetAndProcessor.assetName, asset, err);
          throw err;
        });
      promises.push(promise);
    });

    Promise.all(promises)
      .then(function () {
        self.options.onEnd();
        compileCallback();
      })
      .catch(function (err) {
        self.options.onEnd(err);
        compileCallback(err);
      });
  });
};

module.exports = LastCallWebpackPlugin;
