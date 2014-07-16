'use strict';
module.exports = function(app, cfg) {
    var auth = require('./api'),
        main = require('./main');
    auth(app, cfg);
    main(app);
}