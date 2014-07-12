'use strict';
module.exports = function(app) {
    var auth = require('./api'),
        main = require('./main');
    auth(app);
    main(app);
}