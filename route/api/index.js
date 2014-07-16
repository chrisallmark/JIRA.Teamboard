'use strict';
module.exports = function(app, cfg) {
    var api = require('./api');
    api(app, cfg);
}