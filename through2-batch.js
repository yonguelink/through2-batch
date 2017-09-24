// Like through2 except execute in batches (with a size)
var through2 = require('through2');

module.exports = function batchThrough(options, transform, flush) {
  var batched = [];
  var batchSize;
  var lastEnc = null;

  if (typeof options === 'function') {
      flush     = transform;
      transform = options;
      options   = {};
  }

  if (typeof flush !== 'function') {
      flush = function (callback) {
          callback();
      };
  }

  batchSize = options.batchSize || 10;

  function _transform(message, enc, callback) {
      var self = this;
      lastEnc = enc;
      var callbackCalled = false;
      batched.push(message);

      if (batched.length < batchSize) {
          callback();
      } else {
          transform.call(this, batched, enc, function (err, data) {
              batched = [];
              callback(err, data);
          });
      }
  }

  function _flush(callback) {
      var self = this;

      if (batched.length > 0) {
          transform.call(this, batched, lastEnc, function (err) {
              batched = [];
              if (err) callback(err);
              else flush.call(self, callback);
          });
      } else {
          flush.call(this,callback);
      }
  }

  return through2(options, _transform, _flush);
};

module.exports.obj = function (options, transform, flush) {
  if (typeof options === 'function') {
    flush     = transform;
    transform = options;
    options   = {};
  }

  options.objectMode = true;
  if (options.highWaterMark === null) {
    options.highWaterMark = 16;
  }
  return module.exports(options, transform, flush);
};
