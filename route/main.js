'use strict';
module.exports = function(app) {
    console.log('2');
    app.get('/configurations', function(request, response) {
        console.log('3');
        response.sendfile('./app/index.html');
    });
    app.get('/configuration/:id', function(request, response) {
        response.sendfile('./app/index.html');
    });
    app.get('/:id', function(request, response) {
        response.sendfile('./app/index.html');
    });
}
