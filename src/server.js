/*
JIRA Teamboard - an electronic information radiator
Copyright (C) 2014 Chris Allmark

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

var bodyParser = require('body-parser'),
    express = require('express'),
    route = require('./route');

var app = express();
app.use(bodyParser.json({}));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('./app'));

route(app, require('./server.json'));

app.listen(process.env.PORT || 1337);