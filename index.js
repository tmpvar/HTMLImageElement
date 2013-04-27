var pngparse = require('pngparse');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var fs = require('fs');
var request = require('request');
var urlmaster = require('urlmaster');

// workaround pngparse issue #1
var zlib = require('zlib');
zlib.Inflate.prototype.destroy = function() {};

function HTMLImageElement(width, height) {

  EventEmitter.call(this);

  var complete = false, src, that = this;

  var trigger = function(name, data) {
    if (typeof that['on' + name] === 'function') {
      that['on' + name]();
    }

    that.emit(name, data);
  };

  this.width = width || 0;
  this.width = height || 0;

  //          attribute DOMString src;

  Object.defineProperty(this, 'src', {
    get : function() {
      return src;
    },
    set : function(url) {
      src = that.resolve(url);
      process.nextTick(function() {
        var stream;

        if (src.substring(0,4) === 'file') {
          stream = fs.createReadStream(src.replace('file://', ''));
        } else {
          stream = request.get(src);
        }

        pngparse.parseStream(stream, function(err, data) {
          if (err) {
            trigger('error', err);
          } else {
            that.imageData = data;
            trigger('load');
          }
        });
      });
    }
  });

  Object.defineProperty(this, 'naturalWidth', {
    get : function() {
      if (that.imageData) {
        return that.imageData.width || 0;
      }
    }
  });

  Object.defineProperty(this, 'naturalHeight', {
    get : function() {
      if (that.imageData) {
        return that.imageData.height || 0;
      }
    }
  });

  Object.defineProperty(this, 'complete', {
    get : function() {
      return complete;
    }
  });

  this.addEventListener = this.on;
  this.removeEventListener = this.removeListener;
};

util.inherits(HTMLImageElement, EventEmitter);



HTMLImageElement.prototype.alt = '';
HTMLImageElement.prototype.crossOrigin = '';
HTMLImageElement.prototype.useMap = '';
HTMLImageElement.prototype.width = 0;
HTMLImageElement.prototype.height = 0;
HTMLImageElement.prototype.resolve = function(url) {
  return urlmaster.resolve('file://' + __dirname, url);
};

module.exports.HTMLImageElement = HTMLImageElement;
module.exports.Image = HTMLImageElement;
