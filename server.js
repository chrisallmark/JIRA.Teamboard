'use strict';

var bodyParser = require('body-parser'),
    express = require('express'),
    mongodb = require('mongodb'),
    morgan = require('morgan'),
    route = require('./route');


var app = express();
app.use(bodyParser());
app.use(express.static('./app'));
app.use(morgan());
route(app);

global.bambooHost = 'https://bamboo.host.com';
global.crowdUser = 'username';
global.crowdPass = 'password';
global.jiraFlagged = 'customfield_10200';
global.jiraHost = 'https://jira.host.com';
global.jiraPoints = 'customfield_11700';
global.jiraPointsDefault = 5;

mongodb.MongoClient.connect('mongodb://127.0.0.1:27017/teamboard', function(err, db) {
    if (err) {
        throw err;
    } else {
        global.db = db;
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
        app.listen(process.env.PORT || 1337);
    }
});


