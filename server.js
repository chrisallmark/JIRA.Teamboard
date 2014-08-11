'use strict';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var bodyParser = require('body-parser'),
    express = require('express'),
    morgan = require('morgan'),
    route = require('./route');

var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./app'));
app.use(morgan('combined'));

route(app, require('./server.json'));

app.listen(process.env.PORT || 1337);