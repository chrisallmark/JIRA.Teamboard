'use strict';

var bodyParser = require('body-parser'),
    express = require('express'),
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

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
app.listen(process.env.PORT || 1337);