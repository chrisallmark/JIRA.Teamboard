'use strict';
module.exports = function(app) {
    app.get('/configurations', function(req, res) {
        res.sendFile('/index.html', {'root': './app'});
    });
    app.get('/configuration/:id', function(req, res) {
        res.sendFile('/index.html', {'root': './app'});
    });
    app.get('/:id', function(req, res) {
        res.sendFile('/index.html', {'root': './app'});
    });
}
