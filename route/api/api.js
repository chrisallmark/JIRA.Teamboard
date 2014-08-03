'use strict';

var extend = require('extend'),
    fs = require('fs'),
    moment = require('moment'),
    q = require('q'),
    request = require('request');

function bamboo(cfg, endpoint) {
    return qRequest({
        auth: {
            user: cfg.crowdUser,
            pass: cfg.crowdPass
        },
        headers: {
            'Accept': 'application/json'
        },
        uri: cfg.bambooHost + endpoint
    });
}

function cfgFile(name) {
    return './cfg/' + name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
}

function jira(cfg, endpoint) {
    return qRequest({
        auth: {
            user: cfg.crowdUser,
            pass: cfg.crowdPass
        },
        headers: {
            'Accept': 'application/json'
        },
        uri: cfg.jiraHost + endpoint
    });
}

function jql(cfg, query, fields, expand, maxResults) {
    return jira(cfg, '/rest/api/latest/search?jql=' +
        encodeURIComponent(query) +
        '&maxResults=' + (maxResults ? maxResults : 999) +
        (fields ? '&fields=' + fields.join() : '') +
        (expand ? '&expand=' + expand.join() : ''));
}

function perfLog(process, timestamp, operation) {
    console.log(process + ' took ' + moment.utc().diff(timestamp) + 'ms' + (operation ? ' for ' + operation : ''));
}

function labelFilter(labels) {
    if (labels) {
        labels = labels.split(',');
    }
    return function (a) {
        return labels ? labels.indexOf(a) != -1 : true;
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
    var timestamp = moment.utc();
    request(options, function (err, res, body) {
        if (err) {
            console.log(err);
            deferred.reject(err);
        } else {
            perfLog('Request', timestamp, options.uri);
            if (res.statusCode === 200) {
                try {
                    deferred.resolve(JSON.parse(body));
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

function statusFilter(a) {
    return a.field === 'status' &&
        a.fromString !== a.toString &&
        !(a.fromString === 'Open' && a.toString === 'Reopened') &&
        !(a.fromString == 'Reopened' && a.toString === 'Open');
}

function timebox(cfg, board, sprint) {
    return jira(cfg, '/rest/greenhopper/latest/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint)
        .then(function (data) {
            return {
                start: moment.utc(data.sprint.startDate).startOf('day'),
                end: moment.utc(data.sprint.endDate).endOf('day')
            };
        });
}

module.exports = function (app, cfg) {
    app.get('/api/configurations', function (req, res) {
        fs.readdir('./cfg', function(err, files) {
            if (err) {
                console.log(err);
                res.send(500);
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
                        res.send(500, err);
                    });
            }
        });
    });

    app.post('/api/configurations', function (req, res) {
        var configuration = {
            board: req.body.board,
            labels: req.body.labels,
            name: req.body.name,
            project: req.body.project,
            slideshow: req.body.slideshow || false,
            sprint: req.body.sprint,
            velocity: req.body.velocity,
            wip: req.body.wip
        };
        fs.writeFile(cfgFile(req.body.name), JSON.stringify(configuration));
        res.send(configuration);
    });

    app.delete('/api/configurations/:configurationName', function (req, res) {
        fs.stat(cfgFile(req.params.configurationName), function(err, stat) {
            if (err) {
                res.send(404);
            }
            else
            {
                fs.unlink(cfgFile(req.params.configurationName), function(err) {
                    if (err) {
                        res.send(500);
                    }
                    else
                    {
                        res.send(200);
                    }
                });
            }
        });
    });

    app.get('/api/configurations/:configurationName', function (req, res) {
        fs.stat(cfgFile(req.params.configurationName), function(err, stat) {
            if (err) {
                res.send(404);
            }
            else
            {
                res.writeHead(200, {"Content-Type": "application/json"});
                var readStream = fs.createReadStream(cfgFile(req.params.configurationName));
                readStream.pipe(res);
            }
        });
    });

    app.get('/api/boards', function (req, res) {
        jira(cfg, '/rest/greenhopper/latest/rapidview')
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
                res.send(500, err);
            });
    });

    app.get('/api/builds', function (req, res) {
        function build(result) {
            if (result.plan.isBuilding) {
                return {
                    branch: result.plan.type === 'chain-branch',
                    end: moment.utc(),
                    name: result.planName,
                    status: "In Progress",
                    start: moment.utc()
                };
            } else {
                return {
                    branch: result.plan.type === 'chain_branch',
                    end: moment.utc(result.buildCompletedTime),
                    key: result.key,
                    name: result.planName,
                    start: moment.utc(result.buildStartedTime),
                    reason: result.buildReason,
                    status: result.state,
                    tests: {
                        passed: result.successfulTestCount,
                        failed: result.failedTestCount
                    }
                };
            }
        }
        bamboo(cfg, '/bamboo/rest/api/latest/result?expand=results.result.plan.branches.branch.latestResult.plan')
            .then(function (data) {
                var builds = [];
                for (var i = 0; i < data.results.result.length; i++) {
                    builds.push(build(data.results.result[i]));
                    for (var j = 0; j < data.results.result[i].plan.branches.branch.length; j++) {
                        builds.push(build(data.results.result[i].plan.branches.branch[j].latestResult));
                    }
                }
                return builds.sort(sortBy("start", true));
            })
            .done(function (builds) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(builds));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/projects', function (req, res) {
        jira(cfg, '/rest/api/latest/project')
            .then(function (data) {
                var projects = [];
                for (var i = 0; i < data.length; i++) {
                    var project = data[i];
                    projects.push({
                        key: project.key,
                        name: project.name
                    });
                }
                return projects.sort(sortBy("name"));
            })
            .done(function (projects) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(projects));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/:board/sprints', function (req, res) {
        jira(cfg, '/rest/greenhopper/latest/sprintquery/' + req.param('board'))
            .then(function (data) {
                var sprints = [];
                for (var i = 0; i < data.sprints.length; i++) {
                    var sprint = data.sprints[i];
                    sprints.push({
                        id: sprint.id,
                        name: sprint.name,
                        state: sprint.state
                    });
                }
                return sprints.sort(sortBy("name"));
            })
            .done(function (sprints) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(sprints));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/burn', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
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
                return jql(cfg, 'sprint=' + req.param('sprint'), ['changelog', 'created', 'issuetype'], ['changelog'])
                    .then(function (data) {
                        var timestamp = moment.utc();
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            issue.fields.created = moment.max(moment.utc(issue.fields.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                            if (issue.fields.created.isBefore(timebox.end) || issue.fields.created.isSame(timebox.end)) {
                                burnStates[issue.fields.created].toDo++;
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created).endOf('day'), timebox.start.clone().add(-1, "millisecond"));
                                    if (history.created.isBefore(timebox.end) || history.created.isSame(timebox.end)) {
                                        history.items = history.items.filter(statusFilter);
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (item.toString === 'Closed') {
                                                burnStates[history.created].done++;
                                                burnStates[history.created].toDo--;
                                            } else if (item.fromString === 'Closed') {
                                                burnStates[history.created].done--;
                                                burnStates[history.created].toDo++;
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
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/cycle/board', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
            .then(function (timebox) {
                return jql(cfg, 'sprint=' + req.param('sprint') + ' AND status was not Closed BEFORE \'' + timebox.start.format('YYYY-MM-DD') + '\' ORDER BY Rank', ['assignee', 'changelog', 'issuetype', cfg.jiraFlagged, 'labels', 'parent', cfg.jiraPoints, 'status', 'summary'], ['changelog'])
                    .then(function (data) {
                        var taskboard = {
                            start: timebox.start,
                            end: timebox.end,
                            issues: []
                        },
                        timestamp = moment.utc();
                        var issues = [];
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (!issue.fields.issuetype.subtask) {
                                issues[issue.key] = {
                                    end: null, //moment.min(moment.utc(), timebox.end),
                                    flagged: (issue.fields[cfg.jiraFlagged] && issue.fields[cfg.jiraFlagged][0].value) === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[cfg.jiraPoints],
                                    start: null, //moment.max(moment.utc(), timebox.start),
                                    state: issue.fields.status.name,
                                    subtasks: [],
                                    type: issue.fields.issuetype.name
                                };
                            }
                        }
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                var subtask = {
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.avatarUrls["48x48"] : null,
                                    end: moment.min(moment.max(moment.utc(), timebox.start.clone().endOf('day')), timebox.end),
                                    flagged: issue.fields[cfg.jiraFlagged] && issue.fields[cfg.jiraFlagged][0].value === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    start: timebox.start,
                                    state: issue.fields.status.name,
                                    transitions: [],
                                    type: issue.fields.issuetype.name
                                };
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.utc(history.created);
                                    if (history.created.isBefore(timebox.end) || history.created.isSame(timebox.end)) {
                                        history.items = history.items.filter(statusFilter);
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (item.fromString === 'Open') {
                                                subtask.start = moment.max(history.created, subtask.start);
                                            }
                                            if (item.toString === 'Closed') {
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
                                if (subtask.state !== 'Open' && subtask.state !== 'Reopened') {
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
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/task/board', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
            .then(function (timebox) {
                return jql(cfg, 'sprint=' + req.param('sprint') + ' ORDER BY Rank', ['assignee', 'issuetype', cfg.jiraFlagged, 'labels', 'parent', cfg.jiraPoints, 'status', 'summary'])
                    .then(function (data) {
                        var issues = [],
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
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (!issue.fields.issuetype.subtask) {
                                issues[issue.key] = {
                                    flagged: (issue.fields[cfg.jiraFlagged] && issue.fields[cfg.jiraFlagged][0].value) === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[cfg.jiraPoints],
                                    state: issue.fields.status.name,
                                    subtasks: [],
                                    type: issue.fields.issuetype.name
                                };
                                taskboard.issuesDone += (issue.fields.status.name === 'Closed' ? issue.fields[cfg.jiraPoints] : 0);
                                taskboard.issuesToDo += (issue.fields.status.name !== 'Closed' ? issue.fields[cfg.jiraPoints] : 0);
                            }
                        }
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                issues[issue.fields.parent.key].subtasks.push({
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.avatarUrls["48x48"] : null,
                                    flagged: issue.fields[cfg.jiraFlagged] && issue.fields[cfg.jiraFlagged][0].value === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    state: issue.fields.status.name,
                                    type: issue.fields.issuetype.name
                                });
                                taskboard.subtasksDone += (issue.fields.status.name === 'Closed' ? 1 : 0);
                                taskboard.subtasksInProgress += (issue.fields.status.name !=='Open' && issue.fields.status.name !== 'Closed' ? 1 : 0);
                                taskboard.subtasksToDo += (issue.fields.status.name === 'Open' ? 1 : 0);
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
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/task/burn', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
            .then(function (timebox) {
                var pool = [];
                return jql(cfg, 'sprint=' + req.param('sprint'), ['changelog', 'created', 'issuetype', 'summary'], ['changelog'])
                    .then(function (data) {
                        var timestamp = moment.utc();
                        for (var date = timebox.start.clone().endOf('day'); date.isBefore(timebox.end) || date.isSame(timebox.end); date.add(1, 'day')) {
                            for (var i = 0; i < data.issues.length; i++) {
                                var issue = data.issues[i];
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.utc(history.created);
                                    if ((history.created.isAfter(timebox.start) || history.created.isSame(timebox.start)) &&
                                        moment.max(moment.utc(history.created), timebox.start).isSame(date, 'day')) {
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (item.field === 'status' && item.fromString !== 'Open' && item.fromString !== item.toString) {
                                                if (!pool[history.author.displayName]) {
                                                    pool[history.author.displayName] = [];
                                                }
                                                if (!pool[history.author.displayName][date]) {
                                                    pool[history.author.displayName][date] = [];
                                                }
                                                if (!pool[history.author.displayName][date][issue.key]) {
                                                    pool[history.author.displayName][date][issue.key] = {
                                                        name: issue.fields.summary,
                                                        transitions: []
                                                    }
                                                }
                                                pool[history.author.displayName][date][issue.key].transitions.push({
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
                        for (var name in pool) {
                            if (pool.hasOwnProperty(name)) {
                                var days = [];
                                for (var date in pool[name]) {
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
                        return {
                            start: timebox.start,
                            end: timebox.end,
                            burners: burners.sort(sortBy("name"))
                        };
                    });
            })
            .done(function (burn) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(burn));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/task/flow', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
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
                return jql(cfg, 'sprint=' + req.param('sprint'), ['changelog', 'created', 'issuetype'], ['changelog'])
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
                                        history.items = history.items.filter(statusFilter);
                                        for (var k = 0; k < history.items.length; k++) {
                                            var item = history.items[k];
                                            if (item.fromString === 'Open' || item.fromString === "Reopened") {
                                                flowStates[history.created].toDo--;
                                                if (item.toString === 'Closed') {
                                                    flowStates[history.created].done++;
                                                } else {
                                                    flowStates[history.created].inProgress++;
                                                }
                                            } else if (item.fromString === 'Closed') {
                                                flowStates[history.created].done--;
                                                if (item.toString === 'Open' || item.toString === 'Reopened') {
                                                    flowStates[history.created].toDo++;
                                                } else {
                                                    flowStates[history.created].inProgress++;
                                                }
                                            } else {
                                                if (item.toString === 'Open' || item.toString === 'Reopened') {
                                                    flowStates[history.created].inProgress--;
                                                    flowStates[history.created].toDo++;
                                                } else if (item.toString === 'Closed') {
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
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/task/work', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
            .then(function (timebox) {
                return jql(cfg, 'sprint=' + req.param('sprint') + ' AND type not in standardIssueTypes() AND status was not Closed ON \'' + moment.min(moment.utc(), timebox.end).format('YYYY-MM-DD') + '\'', ['issuetype','labels'])
                    .then(function (data) {
                        var count = [],
                            timestamp = moment.utc();
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            issue.fields.labels = issue.fields.labels.filter(labelFilter(req.param('labels')));
                            var labels = issue.fields.labels.length === 0 ? '?' : issue.fields.labels.sort().join('/');
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
                        return work.sort(sortBy("category"));
                    });
            })
            .done(function (work) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(work));

            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/:board/:sprint/timer', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
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
                res.send(500, err);
            });
    });

    app.get('/api/:project/burn', function (req, res) {
        var start = moment.utc().add(-60, 'days').startOf('day'),
            end = moment.utc().endOf('day');
        jql(cfg, 'project=' + req.param('project') + ' AND type in standardIssueTypes() AND status was not Closed BEFORE \'' + start.format('YYYY-MM-DD') + '\'', ['changelog', 'created'], ['changelog'])
            .then(function (data) {
                var burn = [],
                    burnState = {
                        done: 0,
                        toDo: 0
                    },
                    burnStates = [],
                    timestamp = moment.utc();
                for (var date = start.clone().add(-1, 'millisecond'); date.isBefore(end) || date.isSame(end); date.add(1, 'day')) {
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
                        history.items = history.items.filter(statusFilter);
                        for (var k = 0; k < history.items.length; k++) {
                            var item = history.items[k];
                            if (item.toString === 'Closed') {
                                burnStates[history.created.endOf('day')].done++;
                                burnStates[history.created.endOf('day')].toDo--;
                            }
                            if (item.fromString === 'Closed' && item.toString === 'Reopened') {
                                burnStates[history.created.endOf('day')].done--;
                                burnStates[history.created.endOf('day')].toDo++;
                            }
                        }
                    }
                }
                for (var date = start.clone().add(-1, 'millisecond'); date.isBefore(end) || date.isSame(end); date.add(1, 'day')) {
                    burnState.done += burnStates[date].done;
                    burnState.toDo += burnStates[date].toDo;
                    burn.push(extend({ date: date.clone() }, burnState));
                }
                perfLog('Project Burn', timestamp, req.url);
                return burn;
            })
            .done(function (burn) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(burn));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/:project/:board/:sprint/release/board/:velocity', function (req, res) {
        timebox(cfg, req.param('board'), req.param('sprint'))
            .then(function (timebox) {
                return jql(cfg, 'project=' + req.param('project') + ' AND type in standardIssueTypes() AND status = \'Open\' AND (sprint not in openSprints() OR sprint is EMPTY) ORDER BY Rank', [cfg.jiraFlagged, 'issuetype', cfg.jiraPoints, 'labels', 'summary', 'status'], [], 999)
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
                            if (releaseboard.length === 0 || (releaseboard[releaseboard.length - 1].points + (issue.fields[cfg.jiraPoints] || cfg.jiraPointsDefault) > Number(req.param('velocity')) * 1.10 && i > 0 && i < data.issues.length - 1)) {
                                releaseboard.push({
                                    start: timebox.start.clone().add(releaseboard.length * totalDays, 'days'),
                                    end: timebox.end.clone().add(releaseboard.length * totalDays, 'days'),
                                    points: 0,
                                    issues: []
                                });
                            }
                            releaseboard[releaseboard.length -1].issues.push({
                                flagged: (issue.fields[cfg.jiraFlagged] && issue.fields[cfg.jiraFlagged][0].value) === 'Yes',
                                key: issue.key,
                                labels: issue.fields.labels.sort(),
                                name: issue.fields.summary,
                                points: issue.fields[cfg.jiraPoints],
                                state: issue.fields.status.name,
                                type: issue.fields.issuetype.name
                            });
                            releaseboard[releaseboard.length-1].points += issue.fields[cfg.jiraPoints] || cfg.jiraPointsDefault;
                        }
                        perfLog('Releaseboard', timestamp, req.url);
                        return releaseboard;
                    });
            })
            .done(function (releaseboard) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(releaseboard));
            }, function (err) {
                res.send(500, err);
            });
    });
};