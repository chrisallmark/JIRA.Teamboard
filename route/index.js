'use strict';
module.exports = function(app, cfg) {
console.log('1');
    var auth = require('./api'),
        main = require('./main');
    auth(app, cfg);
    main(app);
}