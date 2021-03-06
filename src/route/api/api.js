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

var extend = require('extend'),
    fs = require('fs'),
    moment = require('moment'),
    q = require('q'),
    request = require('request');

function bambooAPI(cfg, endpoint) {
    return q.when(cfg.bamboo.host ? qRequest({
        auth: {
            user: cfg.crowd.username,
            pass: cfg.crowd.password
        },
        headers: {
            'Accept': 'application/json'
        },
        uri: cfg.bamboo.host + endpoint
    }) : null);
}

function build(result) {
    if (result.plan.isBuilding) {
        return {
            branch: result.plan.type === 'chain_branch',
            end: moment.utc(),
            name: result.planName,
            start: moment.utc(),
            status: "In Progress"
        };
    } else {
        return {
            branch: result.plan.type === 'chain_branch',
            end: moment.utc(result.buildCompletedTime || result.buildStartedTime ),
            key: result.key,
            name: result.planName,
            reason: result.buildReason,
            start: moment.utc(result.buildStartedTime),
            status: result.state,
            tests: {
                passed: result.successfulTestCount,
                failed: result.failedTestCount
            }
        };
    }
}

function cfgFile(name) {
    return './cfg/' + name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
}

function isClosed(cfg, status) {
    return cfg.status.closed.indexOf(status) !== -1;
}

function isOpen(cfg, status) {
    return cfg.status.open.indexOf(status) !== -1;
}

function jira(cfg, endpoint) {
    return q.when(cfg.jira.host ? qRequest({
        auth: {
            user: cfg.crowd.username,
            pass: cfg.crowd.password
        },
        encoding: null,
        uri: cfg.jira.host + endpoint
    }) : null);
}

function jiraAPI(cfg, endpoint) {
    return q.when(cfg.jira.host ? qRequest({
        auth: {
            user: cfg.crowd.username,
            pass: cfg.crowd.password
        },
        headers: {
            'Accept': 'application/json'
        },
        uri: cfg.jira.host + endpoint
    }) : null);
}

function jql(cfg, query, fields, expand, maxResults) {
    return jiraAPI(cfg, '/rest/api/latest/search?jql=' +
        encodeURIComponent(query) +
        '&maxResults=' + (maxResults ? maxResults : 999) +
        (fields ? '&fields=' + fields.join() : '') +
        (expand ? '&expand=' + expand.join() : ''));
}

function perfLog(process, timestamp, operation) {
    console.log(process + ' took ' + moment().diff(timestamp) + 'ms' + (operation ? ' for ' + operation : ''));
}

function labelFilter(labels) {
    if (labels) {
        labels = labels.split(',');
    }
    return function (a) {
        return labels ? labels.indexOf(a) !== -1 : true;
    };
}

function qReadFile(file) {
    var deferred = q.defer();
    fs.readFile(file, function(err, data) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            try {
                deferred.resolve(JSON.parse(data));
            } catch (e) {
                deferred.reject(e.message);
            }
        }
    });
    return deferred.promise;
}

function qRequest(options) {
    var deferred = q.defer();
    var timestamp = moment();
    request(options, function (err, res, body) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            perfLog('Request', timestamp, options.uri);
            if (res.statusCode === 200) {
                try {
                    deferred.resolve(res.headers['content-type'].indexOf('application/json') !== -1 ? JSON.parse(body) : body);
                } catch (e) {
                    deferred.reject(e.message);
                }
            } else {
                deferred.reject(res.statusCode);
            }
        }
    });
    return deferred.promise;
}

function sortBy(property, reverse) {
    return function (a, b) {
        if (reverse) {
            if (moment.isMoment(a[property]) && moment.isMoment(b[property])) {
                return a[property].isAfter(b[property]) ? -1 : (a[property].isBefore(b[property]) ? 1 : 0);
            } else {
                return a[property] > b[property] ? -1 : (a[property] < b[property] ? 1 : 0);
            }
        } else {
            if (moment.isMoment(a[property]) && moment.isMoment(b[property])) {
                return a[property].isBefore(b[property]) ? -1 : (a[property].isAfter(b[property]) ? 1 : 0);
            } else {
                return a[property] < b[property] ? -1 : (a[property] > b[property] ? 1 : 0);
            }
        }
    };
}

function state(cfg, status) {
    return isOpen(cfg, status) ? "Open" : isClosed(cfg, status) ? "Closed" : "In Progress";
}

function statusFilter(cfg) {
    return function(a) {
        return a.field === 'status' && a.fromString !== a.toString && !(isOpen(cfg, a.fromString) && isOpen(cfg, a.toString));
    }
}

function timebox(cfg, board, sprint) {
    return jiraAPI(cfg, '/rest/greenhopper/latest/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint)
        .then(function (data) {
             return {
                sprint: data.sprint.name,
                start: data.sprint.startDate === 'None' ? moment.utc() : moment.utc(data.sprint.startDate.substring(0, 10) + '12:00').startOf('day'),
                end: data.sprint.startDate === 'None' ? moment.utc() : moment.utc(data.sprint.endDate.substring(0, 10) + '12:00').endOf('day')
            };
        });
}

function timetrackFilter(cfg) {
    return function(a) {
        return (a.field === 'status' && a.fromString !== a.toString && !(isOpen(cfg, a.fromString) && isOpen(cfg, a.toString))) || a.field === 'timeestimate';
    }
}

module.exports = function (app, cfg) {

    app.get('/api/configurations', function (req, res) {
        fs.readdir('./cfg', function(err, files) {
            if (err) {
                console.log(err);
                res.status(500, err).end();
            }
            else
            {
                var qConfigurations = [];
                for (var i = 0; i < files.length; i++) {
                    if (files[i].indexOf('.json', files[i].length - 5) !== -1) {
                        qConfigurations.push(qReadFile('./cfg/' + files[i]));
                    }
                }
                q.all(qConfigurations)
                    .then(function (configurations) {
                        return configurations.sort(sortBy("name"));
                    })
                    .done(function (configurations) {
                        res.writeHead(200, { 'Content-Type': 'application/json' });
                        res.end(JSON.stringify(configurations));
                    }, function (err) {
                        res.status(500, err).end();
                    });
            }
        });
    });

    app.post('/api/configurations', function (req, res) {
        var configuration = {
            animate: req.body.animate || false,
            backlog: req.body.backlog,
            board: req.body.board,
            builds: req.body.builds,
            labels: req.body.labels,
            logo: req.body.logo,
            name: req.body.name,
            slideshow: req.body.slideshow || false,
            sprint: req.body.sprint,
            target: req.body.target,
            timetrack: req.body.timetrack || false,
            velocity: req.body.velocity,
            wip: req.body.wip
        };
        fs.writeFile(cfgFile(req.body.name), JSON.stringify(configuration));
        res.send(configuration);
    });

    app.delete('/api/configurations/:configurationName', function (req, res) {
        fs.stat(cfgFile(req.params.configurationName), function(err, stat) {
            if (err) {
                res.status(404, err).end();
            }
            else
            {
                fs.unlink(cfgFile(req.params.configurationName), function(err) {
                    if (err) {
                        res.status(500, err).end();
                    }
                    else
                    {
                        res.send(200).end();
                    }
                });
            }
        });
    });

    app.get('/api/configurations/:configurationName', function (req, res) {
        fs.stat(cfgFile(req.params.configurationName), function(err, stat) {
            if (err) {
                res.status(404, err).end();
            }
            else
            {
                res.writeHead(200, {"Content-Type": "application/json"});
                var readStream = fs.createReadStream(cfgFile(req.params.configurationName));
                readStream.pipe(res);
            }
        });
    });

    app.get('/api/avatar/:name', function (req, res) {
        jira(cfg, '/secure/useravatar?ownerId=' + req.params.name)
            .then(function(data) {
                res.writeHead(200, { 'Cache-Control': 'public, max-age=' + 60 * 60 * 24 * 90, 'Content-Type': 'image/png' });
                res.end(data, 'binary');
            });
    });

    app.get('/api/boards', function (req, res) {
        jiraAPI(cfg, '/rest/greenhopper/latest/rapidview')
            .then(function (data) {
                var boards = [];
                for (var i = 0; i < data.views.length; i++) {
                    var view = data.views[i];
                    if (view.sprintSupportEnabled) {
                        boards.push({
                            id: view.id,
                            name: view.name
                        });
                    }
                }
                return boards.sort(sortBy("name"));
            })
            .done(function (boards) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(boards));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/builds', function (req, res) {
        bambooAPI(cfg, '/bamboo/rest/api/latest/project')
            .then(function (data) {
                var builds = [];
                if (data) {
                    for (var i = 0; i < data.projects.project.length; i++) {
                        var project = data.projects.project[i];
                        builds.push({
                            name: project.name
                        });
                    }
                }
                return builds.sort(sortBy("name"));
            })
            .done(function (builds) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(builds));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/builds/results', function (req, res) {
        bambooAPI(cfg, '/bamboo/rest/api/latest/result?expand=results.result.plan.branches.branch.latestResult.plan')
            .then(function (data) {
                var builds = [];
                if (data) {
                    for (var i = 0; i < data.results.result.length; i++) {
                        if (!req.params.builds || req.params.builds.indexOf(data.results.result[i].plan.projectName) !== -1) {
                            if (data.results.result[i].plan.enabled) {
                                builds.push(build(data.results.result[i]));
                                for (var j = 0; j < data.results.result[i].plan.branches.branch.length; j++) {
                                    if (data.results.result[i].plan.branches.branch[j].enabled) {
                                        if (data.results.result[i].plan.branches.branch[j].latestResult) {
                                            builds.push(build(data.results.result[i].plan.branches.branch[j].latestResult));
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
                return builds.sort(sortBy("end", true));
            })
            .done(function (builds) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(builds));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/backlogs', function (req, res) {
        jiraAPI(cfg, '/rest/api/latest/project')
            .then(function (data) {
                var backlogs = [];
                for (var i = 0; i < data.length; i++) {
                    var project = data[i];
                    backlogs.push({
                        key: project.key,
                        name: project.name
                    });
                }
                return backlogs.sort(sortBy("name"));
            })
            .done(function (backlogs) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(backlogs));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:board/sprints', function (req, res) {
        jiraAPI(cfg, '/rest/greenhopper/latest/sprintquery/' + req.params.board + '?includeFutureSprints=true')
            .then(function (data) {
                var sprints = [];
                for (var i = 0; i < data.sprints.length; i++) {
                    var sprint = data.sprints[i];
                    sprints.push({
                        id: sprint.id,
                        name: sprint.name
                    });
                }
                return sprints.sort(sortBy("name"));
            })
            .done(function (sprints) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(sprints));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/burn/:timetrack', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                var burn = [],
                    burnState = {
                        done: 0,
                        toDo: 0
                    },
                    burnStates = [];
                for (var date = timebox.start.clone().add(-1, 'millisecond'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                    burnStates[date] = {
                        done: 0,
                        toDo: 0
                    };
                }
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint, ['changelog', 'created', 'issuetype', 'timeestimate', 'timeoriginalestimate'], ['changelog'])
                    .then(function (data) {
                        var timestamp = moment.utc();
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            issue.fields.created = moment.max(moment.utc(issue.fields.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                            if (issue.fields.created.isBefore(timebox.end) || issue.fields.created.isSame(timebox.end)) {
                                if (req.params.timetrack === "true") {
                                    burnStates[issue.fields.created].toDo += parseInt(issue.fields.timeestimate || 0) / 3600;
                                } else {
                                    burnStates[issue.fields.created].toDo++;
                                }
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                                    if (history.created.isBefore(timebox.end) || history.created.isSame(timebox.end)) {
                                        if (req.params.timetrack === "true") {
                                            history.items = history.items.filter(timetrackFilter(cfg));
                                        } else {
                                            history.items = history.items.filter(statusFilter(cfg));
                                        }
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (req.params.timetrack === "true") {
                                                if (item.field === 'status') {
                                                    if (isClosed(cfg, item.toString)) {
                                                        burnStates[history.created].done += parseInt(issue.fields.timeestimate || 0) / 3600;
                                                        burnStates[history.created].toDo -= parseInt(issue.fields.timeestimate || 0) / 3600;
                                                    } else if (isClosed(cfg, item.fromString)) {
                                                        burnStates[history.created].done -= parseInt(issue.fields.timeestimate || 0) / 3600;
                                                        burnStates[history.created].toDo += parseInt(issue.fields.timeestimate || 0) / 3600;
                                                    }
                                                } else if (item.field === 'timeestimate') {
                                                    burnStates[history.created].done += (parseInt(item.to || 0) - parseInt(item.from || 0)) / 3600;
                                                }
                                            } else {
                                                if (isClosed(cfg, item.toString)) {
                                                    burnStates[history.created].done++;
                                                    burnStates[history.created].toDo--;
                                                } else if (isClosed(cfg, item.fromString)) {
                                                    burnStates[history.created].done--;
                                                    burnStates[history.created].toDo++;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        for (var date = timebox.start.clone().add(-1, 'millisecond'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                            burnState.done += burnStates[date].done;
                            burnState.toDo += burnStates[date].toDo;
                            burn.push(extend({ date: date.clone() }, burnState));
                        }
                        perfLog('Sprint Burn', timestamp, req.url);
                        return burn;
                    });
            })
            .done(function (burn) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(burn));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/cycle/board', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint + ' ORDER BY Rank', ['assignee', 'changelog', 'issuetype', cfg.jira.flagged, 'labels', 'parent', cfg.jira.points, 'status', 'summary'], ['changelog'])
                    .then(function (data) {
                        var taskboard = {
                            start: timebox.start,
                            end: timebox.end,
                            issues: []
                        },
                        timestamp = moment.utc();
                        var i, issue, issues = [];
                        for (i = 0; i < data.issues.length; i++) {
                            issue = data.issues[i];
                            if (!issue.fields.issuetype.subtask) {
                                issues[issue.key] = {
                                    end: null,
                                    flagged: issue.fields[cfg.jira.flagged] !== null,
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[cfg.jira.points],
                                    start: null,
                                    state: state(cfg, issue.fields.status.name),
                                    status: issue.fields.status.name,
                                    subtasks: [],
                                    type: issue.fields.issuetype.name
                                };
                            }
                        }
                        for (i = 0; i < data.issues.length; i++) {
                            issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                var subtask = {
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.name : null,
                                    end: moment.min(moment.max(moment.utc(), timebox.start.clone().endOf('day')), timebox.end),
                                    flagged: issue.fields[cfg.jira.flagged] !== null,
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    start: timebox.start,
                                    state: state(cfg, issue.fields.status.name),
                                    status: issue.fields.status.name,
                                    transitions: [],
                                    type: issue.fields.issuetype.name
                                };
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.utc(history.created);
                                    if (history.created.isBefore(timebox.end) || history.created.isSame(timebox.end)) {
                                        history.items = history.items.filter(statusFilter(cfg));
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (isOpen(cfg, item.fromString)) {
                                                subtask.start = moment.max(history.created, subtask.start);
                                            }
                                            if (isClosed(cfg, item.toString)) {
                                                subtask.end = moment.min(history.created, subtask.end);
                                            }
                                            subtask.transitions.push({
                                                date: history.created,
                                                fromState: item.fromString,
                                                toState: item.toString
                                            });
                                        }
                                    }
                                }
                                if (subtask.state !== "Open") {
                                    issues[issue.fields.parent.key].start = issues[issue.fields.parent.key].start === null ? subtask.start : moment.min(subtask.start, issues[issue.fields.parent.key].start);
                                    issues[issue.fields.parent.key].end = issues[issue.fields.parent.key].end === null ? subtask.end : moment.max(subtask.end, issues[issue.fields.parent.key].end);
                                    issues[issue.fields.parent.key].subtasks.push(subtask);
                                }
                            }
                        }
                        for (var key in issues) {
                            if (issues.hasOwnProperty(key)) {
                                taskboard.issues.push(issues[key]);
                            }
                        }
                        perfLog('Cycleboard', timestamp, req.url);
                        return taskboard;
                    });
            })
            .done(function (taskboard) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(taskboard));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/task/board', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint + ' ORDER BY Rank', ['assignee', 'issuetype', cfg.jira.flagged, 'labels', 'parent', cfg.jira.points, 'status', 'summary'])
                    .then(function (data) {
                        var i,
                            issue,
                            issues = [],
                            subtask,
                            taskboard = {
                                start: timebox.start,
                                end: timebox.end,
                                issues: [],
                                issuesDone: 0,
                                issuesToDo: 0,
                                subtasksDone: 0,
                                subtasksInProgress: 0,
                                subtasksToDo: 0
                            },
                            timestamp = moment.utc();
                        for (i = 0; i < data.issues.length; i++) {
                            issue = data.issues[i];
                            if (!issue.fields.issuetype.subtask) {
                                subtask = {
                                    flagged: issue.fields[cfg.jira.flagged] !== null,
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[cfg.jira.points],
                                    state: state(cfg, issue.fields.status.name),
                                    status: issue.fields.status.name,
                                    subtasks: [],
                                    type: issue.fields.issuetype.name
                                };
                                issues[issue.key] = subtask;
                                taskboard.issuesDone += (subtask.state === 'Closed' ? issue.fields[cfg.jira.points] : 0);
                                taskboard.issuesToDo += (subtask.state !== 'Closed' ? issue.fields[cfg.jira.points] : 0);
                            }
                        }
                        for (i = 0; i < data.issues.length; i++) {
                            issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                subtask = {
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.name : null,
                                    flagged: issue.fields[cfg.jira.flagged] !== null,
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    state: state(cfg, issue.fields.status.name),
                                    status: issue.fields.status.name,
                                    type: issue.fields.issuetype.name
                                };
                                issues[issue.fields.parent.key].subtasks.push(subtask);
                                taskboard.subtasksDone += (subtask.state === "Closed" ? 1 : 0);
                                taskboard.subtasksInProgress += (subtask.state === "In Progress" ? 1 : 0);
                                taskboard.subtasksToDo += (subtask.state === "Open" ? 1 : 0);
                            }
                        }
                        for (var key in issues) {
                            if (issues.hasOwnProperty(key)) {
                                taskboard.issues.push(issues[key]);
                            }
                        }
                        perfLog('Taskboard', timestamp, req.url);
                        return taskboard;
                    });
            })
            .done(function (taskboard) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(taskboard));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/task/burn', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                var pool = [];
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint, ['changelog', 'created', 'issuetype', 'summary'], ['changelog'])
                    .then(function (data) {
                        var date, name, timestamp = moment.utc();
                        for (date = timebox.start.clone().endOf('day'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                            for (var i = 0; i < data.issues.length; i++) {
                                var issue = data.issues[i];
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.utc(history.created);
                                    if ((history.created.isAfter(timebox.start) || history.created.isSame(timebox.start)) &&
                                        moment.max(moment.utc(history.created), timebox.start).isSame(date, 'day')) {
                                        history.items = history.items.filter(statusFilter(cfg));
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            name = history.author.displayName === '' ? '_' : history.author.displayName;
                                            if (!isOpen(cfg, item.fromString)) {
                                                if (!pool[name]) {
                                                    pool[name] = [];
                                                }
                                                if (!pool[name][date]) {
                                                    pool[name][date] = [];
                                                }
                                                if (!pool[name][date][issue.key]) {
                                                    pool[name][date][issue.key] = {
                                                        name: issue.fields.summary,
                                                        transitions: []
                                                    }
                                                }
                                                pool[name][date][issue.key].transitions.push({
                                                    fromState: item.fromString,
                                                    toState: item.toString
                                                });
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        var burners = [];
                        for (name in pool) {
                            if (pool.hasOwnProperty(name)) {
                                var days = [];
                                for (date in pool[name]) {
                                    var subtasks = [];
                                    for (var key in pool[name][date]) {
                                        if (pool[name][date].hasOwnProperty(key)) {
                                            subtasks.push(extend({ key: key }, pool[name][date][key]));
                                        }
                                    }
                                    subtasks.sort(sortBy("key"));
                                    if (pool[name].hasOwnProperty(date)) {
                                        days.push({
                                            date: date,
                                            subtasks: subtasks
                                        });
                                    }
                                }
                                burners.push({
                                    name: name,
                                    days: days
                                });
                            }
                        }
                        perfLog('Task Burn', timestamp, req.url);
                        burners = burners.sort(sortBy("name"));
                        if (burners.length > 0 && burners[burners.length - 1].category === '_') {
                            burners[burners.length - 1].category = 'Anonymous';
                        }
                        return {
                            start: timebox.start,
                            end: timebox.end,
                            burners: burners
                        };
                    });
            })
            .done(function (burn) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(burn));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/task/flow', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                var flow = [],
                    flowState = {
                        done: 0,
                        inProgress: 0,
                        toDo: 0
                    },
                    flowStates = [];
                for (var date = timebox.start.clone().add(-1, 'millisecond'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                    flowStates[date] = {
                        done: 0,
                        inProgress: 0,
                        toDo: 0
                    };
                }
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint, ['changelog', 'created', 'issuetype'], ['changelog'])
                    .then(function (data) {
                        var timestamp = moment.utc();
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            issue.fields.created = moment.max(moment.utc(issue.fields.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                            if (issue.fields.created.isBefore(timebox.end) || issue.fields.created.isSame(timebox.end)) {
                                flowStates[issue.fields.created].toDo++;
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                                    if (history.created.isBefore(timebox.end) || history.created.isSame(timebox.end)) {
                                        history.items = history.items.filter(statusFilter(cfg));
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (isOpen(cfg, item.fromString)) {
                                                flowStates[history.created].toDo--;
                                                if (isClosed(cfg, item.toString)) {
                                                    flowStates[history.created].done++;
                                                } else {
                                                    flowStates[history.created].inProgress++;
                                                }
                                            } else if (isClosed(cfg, item.fromString)) {
                                                flowStates[history.created].done--;
                                                if (isOpen(cfg, item.toString)) {
                                                    flowStates[history.created].toDo++;
                                                } else {
                                                    flowStates[history.created].inProgress++;
                                                }
                                            } else {
                                                if (isOpen(cfg, item.toString)) {
                                                    flowStates[history.created].inProgress--;
                                                    flowStates[history.created].toDo++;
                                                } else if (isClosed(cfg, item.toString)) {
                                                    flowStates[history.created].inProgress--;
                                                    flowStates[history.created].done++;
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        for (var date = timebox.start.clone().add(-1, 'millisecond'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                            flowState.done += flowStates[date].done;
                            flowState.inProgress += flowStates[date].inProgress;
                            flowState.toDo += flowStates[date].toDo;
                            flow.push(extend({ date: date.clone() }, flowState));
                        }
                        perfLog('Task flow', timestamp, req.url);
                        return flow;
                    });
            })
            .done(function (flow) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(flow));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/task/work', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                return jql(cfg, 'project=' + req.params.backlog + ' AND sprint=' + req.params.sprint + ' AND type not in standardIssueTypes() AND status was not in (\'' + cfg.status.closed.join('\',\'') + '\') ON \'' + moment.min(moment.utc(), timebox.end).format('YYYY-MM-DD') + '\'', ['issuetype','labels'])
                    .then(function (data) {
                        var count = [],
                            timestamp = moment.utc();
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            issue.fields.labels = issue.fields.labels.filter(labelFilter(req.params.labels));
                            var labels = issue.fields.labels.length === 0 ? '_' : issue.fields.labels.sort().join('/');
                            if (!count[labels]) {
                                count[labels] = 0;
                            }
                            count[labels]++;
                        }
                        var work = [];
                        for (var label in count) {
                            if (count.hasOwnProperty(label)) {
                                work.push({
                                    category: label,
                                    work: count[label]
                                });
                            }
                        }
                        perfLog('Task Work', timestamp, req.url);
                        work = work.sort(sortBy("category"));
                        if (work.length > 0 && work[work.length - 1].category === '_') {
                            work[work.length - 1].category = 'Other';
                        }
                        return work;
                    });
            })
            .done(function (work) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(work));

            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:board/:sprint/timer', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                var remainingDays = 0,
                    totalDays = timebox.end.diff(timebox.start, 'days') + 1,
                    workingDays = 0;
                for (var date = timebox.start.clone(); date.isBefore(timebox.end); date.add(1, 'day')) {
                    if (date.isoWeekday() < 6) {
                        if (!date.isBefore(moment.utc().startOf('day'))) {
                            remainingDays++;
                        }
                        workingDays++;
                    }
                }
                return extend(timebox, {
                    remainingDays: remainingDays,
                    totalDays: totalDays,
                    workingDays: workingDays
                });
            })
            .done(function (timer) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(timer));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/burn', function (req, res) {
        var start = moment.utc().add(-60, 'days').startOf('day'),
            end = moment.utc().endOf('day');
        jql(cfg, 'project=' + req.params.backlog + ' AND type in standardIssueTypes() AND status was not in (\'' + cfg.status.closed.join('\',\'') + '\') BEFORE \'' + start.format('YYYY-MM-DD') + '\'', ['changelog', 'created'], ['changelog'])
            .then(function (data) {
                var burn = [],
                    burnState = {
                        done: 0,
                        toDo: 0
                    },
                    burnStates = [],
                    timestamp = moment.utc();
                var date;
                for (date = start.clone().add(-1, 'millisecond'); date.isBefore(end) || date.isSame(end); date.add(1, 'day')) {
                    burnStates[date] = {
                        done: 0,
                        toDo: 0
                    };
                }
                for (var i = 0; i < data.issues.length; i++) {
                    var issue = data.issues[i];
                    issue.fields.created = moment.max(moment.utc(issue.fields.created), start.add(-1, "millisecond"));
                    burnStates[issue.fields.created.endOf('day')].toDo++;
                    for (var j = 0; j < issue.changelog.histories.length; j++) {
                        var history = issue.changelog.histories[j];
                        history.created = moment.max(moment.utc(history.created), start.add(-1, "millisecond"));
                        history.items = history.items.filter(statusFilter(cfg));
                        for (var k = 0; k < history.items.length; k++) {
                            var item = history.items[k];
                            if (isClosed(cfg, item.toString)) {
                                burnStates[history.created.endOf('day')].done++;
                                burnStates[history.created.endOf('day')].toDo--;
                            }
                            if (isClosed(cfg, item.fromString) && isOpen(cfg, item.toString)) {
                                burnStates[history.created.endOf('day')].done--;
                                burnStates[history.created.endOf('day')].toDo++;
                            }
                        }
                    }
                }
                for (date = start.clone().add(-1, 'millisecond'); date.isBefore(end) || date.isSame(end); date.add(1, 'day')) {
                    burnState.done += burnStates[date].done;
                    burnState.toDo += burnStates[date].toDo;
                    burn.push(extend({ date: date.clone() }, burnState));
                }
                perfLog('Backlog Burn', timestamp, req.url);
                return burn;
            })
            .done(function (burn) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(burn));
            }, function (err) {
                res.status(500, err).end();
            });
    });

    app.get('/api/:backlog/:board/:sprint/release/board/:velocity', function (req, res) {
        timebox(cfg, req.params.board, req.params.sprint)
            .then(function (timebox) {
                return jql(cfg, 'project=' + req.params.backlog + ' AND type in standardIssueTypes() AND status IN (\'' + cfg.status.open.join('\',\'') + '\') AND (sprint not in openSprints() OR sprint is EMPTY) ORDER BY Rank', [cfg.jira.flagged, 'issuetype', cfg.jira.points, 'labels', 'summary', 'status'], [], 999)
                    .then(function (data) {
                        var releaseboard =  [],
                            timestamp = moment.utc(),
                            totalDays = timebox.end.diff(timebox.start, 'days') + 1;
                        while (timebox.start.isBefore(moment.utc())) {
                            timebox.start.add(totalDays, 'days');
                            timebox.end.add(totalDays, 'days');
                        }
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (releaseboard.length === 0 || (releaseboard[releaseboard.length - 1].points + (issue.fields[cfg.jira.points] || 0) > Number(req.params.velocity) * 1.10 && i > 0 && i < data.issues.length - 1)) {
                                releaseboard.push({
                                    start: timebox.start.clone().add(releaseboard.length * totalDays, 'days'),
                                    end: timebox.end.clone().add(releaseboard.length * totalDays, 'days'),
                                    points: 0,
                                    issues: []
                                });
                            }
                            releaseboard[releaseboard.length -1].issues.push({
                                flagged: issue.fields[cfg.jira.flagged] !== null,
                                key: issue.key,
                                labels: issue.fields.labels.sort(),
                                name: issue.fields.summary,
                                points: issue.fields[cfg.jira.points],
                                state: state(cfg, issue.fields.status.name),
                                status: issue.fields.status.name,
                                type: issue.fields.issuetype.name
                            });
                            releaseboard[releaseboard.length-1].points += issue.fields[cfg.jira.points] || 0;
                        }
                        perfLog('Releaseboard', timestamp, req.url);
                        return releaseboard;
                    });
            })
            .done(function (releaseboard) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(releaseboard));
            }, function (err) {
                res.status(500, err).end();
            });
    });
};