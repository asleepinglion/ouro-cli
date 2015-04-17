
var SuperJS = require('superjs');

module.exports = SuperJS.Class.extend({

  _metaFile: function() {
    this._loadMeta(__filename);
  },

  init: function (app, options) {
    this._super.apply(this, arguments);
  },

  run: function(resolve, reject) {
    this.log.warn('The run method of this command has not been set.\n');
    resolve();
  }

});