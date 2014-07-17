'use strict';
module.exports = function(app) {
    app.get('/configurations', function(request, response) {
        response.sendfile('./app/index.html');
    });
    app.get('/configuration/:id', function(request, response) {
        response.sendfile('./app/index.html');
    });
    app.get('/:id', function(request, response) {
        response.sendfile('./app/index.html');
    });
}
