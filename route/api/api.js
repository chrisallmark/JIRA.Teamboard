'use strict';

var extend = require('extend'),
    fs = require('fs'),
    moment = require('moment'),
    q = require('q'),
    request = require('request');

function bamboo(endpoint) {
    return qRequest({
        auth: {
            user: global.crowdUser,
            pass: global.crowdPass
        },
        headers: {
            'Accept' : 'application/json'
        },
        uri: global.bambooHost + endpoint
    });
}

function cfg(name) {
    return './cfg/' + name.replace(/[^a-z0-9]/gi, '_').toLowerCase() + '.json';
}

function getSprint(board, sprint) {
    return jira('/rest/greenhopper/latest/rapid/charts/sprintreport?rapidViewId=' + board + '&sprintId=' + sprint)
        .then(function (data) {
            return {
                id: data.sprint.id,
                name: data.sprint.name,
                startDate: moment.utc(data.sprint.startDate).startOf('day'),
                endDate: moment.utc(data.sprint.endDate).endOf('day')
            };
        });
}

function jira(endpoint) {
    return qRequest({
        auth: {
            user: global.crowdUser,
            pass: global.crowdPass
        },
        headers: {
            'Accept': 'application/json'
        },
        uri: global.jiraHost + endpoint
    });
}

function jql(query, fields, expand, maxResults) {
    var search = '/rest/api/latest/search?jql=' + encodeURIComponent(query) + (maxResults ? '&maxResults=' + maxResults : '') + (fields ? '&fields=' + fields.join() : '') + (expand ? '&expand=' + expand.join() : '');
    return jira(search);
}

function qReadFile(file) {
    var deferred = q.defer();
    fs.readFile(file, function(err, data) {
        if (err) {
            deferred.reject(err);
        } else {
            deferred.resolve(JSON.parse(data));
        }
    });
    return deferred.promise;
}

function qRequest(options) {
    var deferred = q.defer();
    request(options, function (err, res, body) {
        if (err) {
            deferred.reject(err);
        } else {
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
        if (moment.isMoment(a[property]) && moment.isMoment(b[property])) {
            return a[property].isBefore(b[property]) ? -1 : (a[property].isAfter(b[property]) ? 1 : 0) * (reverse ? -1 : 1);
        } else {
            return a[property] < b[property] ? -1 : (a[property] > b[property] ? 1 : 0) * (reverse ? -1 : 1);
        }
    };
}

function statusFilter(a) {
    return a.field === 'status' && a.fromString !== a.toString;
}

module.exports = function (app) {
    app.get('/api/configurations', function (req, res) {
        fs.readdir('./cfg', function(err, files) {
            if (err) {
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
            name: req.body.name,
            project: req.body.project,
            slideshow: req.body.slideshow || false,
            sprint: req.body.sprint,
            velocity: req.body.velocity,
            wip: req.body.wip
        };
        fs.writeFile(cfg(req.body.name), JSON.stringify(configuration));
        res.send(configuration);
    });

    app.delete('/api/configurations/:configurationName', function (req, res) {
        fs.stat(cfg(req.params.configurationName), function(err, stat) {
            if (err) {
                res.send(404);
            }
            else
            {
                fs.unlink(cfg(req.params.configurationName), function(err) {
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
        fs.stat(cfg(req.params.configurationName), function(err, stat) {
            if (err) {
                res.send(404);
            }
            else
            {
                res.writeHead(200, {"Content-Type": "application/json"});
                var readStream = fs.createReadStream(cfg(req.params.configurationName));
                readStream.pipe(res);
            }
        });
    });

    app.get('/api/boards', function (req, res) {
        jira('/rest/greenhopper/latest/rapidview')
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
        var build = function (data) {
            return {
                endDate: moment.utc(data.buildCompletedTime),
                key: data.key,
                name: data.planName,
                startDate: moment.utc(data.buildStartedTime),
                reason: data.buildReason,
                status: data.state,
                tests: {
                    passed: data.successfulTestCount,
                    failed: data.failedTestCount
                }
            };
        };
        bamboo('/bamboo/rest/api/latest/result')
            .then(function (data) {
                var qBuild = [];
                for (var i = 0; i < data.results.result.length; i++) {
                    var result = data.results.result[i];
                    qBuild.push(bamboo('/bamboo/rest/api/latest/result/' + result.key)
                        .then(build));
                }
                return q.all(qBuild);
            })
            .then(function (builds) {
                return builds.sort(sortBy("startDate", true));
            })
            .done(function (builds) {
                res.writeHead(200, { 'Content-Type': 'application/json' });
                res.end(JSON.stringify(builds));
            }, function (err) {
                res.send(500, err);
            });
    });

    app.get('/api/projects', function (req, res) {
        jira('/rest/api/latest/project')
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
        jira('/rest/greenhopper/latest/sprintquery/' + req.param('board'))
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                var burn = [],
                    burnState = {
                        done: 0,
                        toDo: 0
                    },
                    burnStates = [];
                for (var date = sprint.startDate.clone().add(-1, 'millisecond'); date.isBefore(sprint.endDate) || date.isSame(sprint.endDate); date.add(1, 'day')) {
                    burnStates[date] = {
                        done: 0,
                        toDo: 0
                    };
                }
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\')', ['changelog', 'created', 'issuetype', 'subtasks'], ['changelog'])
                    .then(function (data) {
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (!(issue.fields.issuetype.name === "Story" && issue.fields.subtasks.length > 0)) {
                                issue.fields.created = moment.max(moment.utc(issue.fields.created), sprint.startDate.add(-1, "millisecond"));
                                burnStates[issue.fields.created.endOf('day')].toDo++;
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created), sprint.startDate.add(-1, "millisecond"));
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
                        }
                        for (var date = sprint.startDate.clone().add(-1, 'millisecond'); date.isBefore(sprint.endDate) || date.isSame(sprint.endDate); date.add(1, 'day')) {
                            burnState.done += burnStates[date].done;
                            burnState.toDo += burnStates[date].toDo;
                            burn.push(extend({ date: date.clone() }, burnState));
                        }
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\') ORDER BY Rank', ['assignee', 'changelog', 'issuetype', global.jiraFlagged, 'labels', 'parent', global.jiraPoints, 'status', 'summary'], ['changelog'])
                    .then(function (data) {
                        var taskboard = {
                            startDate: sprint.startDate,
                            endDate: sprint.endDate,
                            stories: [],
                            storiesDone: 0,
                            storiesToDo: 0,
                            tasksDone: 0,
                            tasksInProgress: 0,
                            tasksToDo: 0
                        };
                        var stories = [];
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.name === "Story") {
                                stories[issue.key] = {
                                    endDate: moment.utc(),
                                    flagged: (issue.fields[global.jiraFlagged] && issue.fields[global.jiraFlagged][0].value) === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[global.jiraPoints],
                                    startDate: moment.utc(),
                                    state: issue.fields.status.name,
                                    tasks: []
                                };
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created), sprint.startDate);
                                    history.items = history.items.filter(statusFilter);
                                    for (var k = 0; k < history.items.length; k++) {
                                        var item = history.items[k];
                                        if (item.fromString === 'Open') {
                                            stories[issue.key].startDate = history.created;
                                        }
                                        if (item.toString === 'Closed') {
                                            stories[issue.key].endDate = history.created;
                                        }
                                    }
                                }
                                taskboard.storiesDone += (issue.fields.status.name === 'Closed' ? issue.fields[global.jiraPoints] : 0);
                                taskboard.storiesToDo += (issue.fields.status.name !== 'Closed' ? issue.fields[global.jiraPoints] : 0);
                            }
                        }
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                var task = {
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.avatarUrls["48x48"] : null,
                                    endDate: moment.utc(),
                                    flagged: issue.fields[global.jiraFlagged] && issue.fields[global.jiraFlagged][0].value === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    startDate: moment.utc(),
                                    state: issue.fields.status.name,
                                    transitions: [],
                                    type: issue.fields.issuetype.name
                                };
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.utc(history.created);
                                    history.items = history.items.filter(statusFilter);
                                    for (var k = 0; k < history.items.length; k++) {
                                        var item = history.items[k];
                                        if (item.fromString === 'Open') {
                                            task.startDate = moment.max(history.created, sprint.startDate);
                                        }
                                        if (item.toString === 'Closed') {
                                            task.endDate = moment.max(history.created, sprint.startDate);
                                        }
                                        task.transitions.push({
                                            date: history.created,
                                            fromState: item.fromString,
                                            toState: item.toString
                                        })
                                    }
                                }
                                if (task.state !== "Open") {
                                    stories[issue.fields.parent.key].endDate = moment.min(stories[issue.fields.parent.key].endDate, task.endDate);
                                    stories[issue.fields.parent.key].startDate = moment.min(stories[issue.fields.parent.key].startDate, task.startDate);
                                    stories[issue.fields.parent.key].tasks.push(task);
                                }
                                taskboard.tasksDone += (task.state === 'Closed' ? 1 : 0);
                                taskboard.tasksInProgress += (task.state !=='Open' && task.state !== 'Closed' ? 1 : 0);
                                taskboard.tasksToDo += (task.state === 'Open' ? 1 : 0);
                            }
                        }
                        for (var key in stories) {
                            if (stories.hasOwnProperty(key)) {
                                taskboard.stories.push(stories[key]);
                            }
                        }
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\') ORDER BY Rank', ['assignee', 'issuetype', global.jiraFlagged, 'labels', 'parent', global.jiraPoints, 'status', 'summary'])
                    .then(function (data) {
                        var taskboard = {
                            startDate: sprint.startDate,
                            endDate: sprint.endDate,
                            stories: [],
                            storiesDone: 0,
                            storiesToDo: 0,
                            tasksDone: 0,
                            tasksInProgress: 0,
                            tasksToDo: 0
                        };
                        var stories = [];
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.name === "Story") {
                                stories[issue.key] = {
                                    flagged: (issue.fields[global.jiraFlagged] && issue.fields[global.jiraFlagged][0].value) === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    points: issue.fields[global.jiraPoints],
                                    state: issue.fields.status.name,
                                    tasks: []
                                };
                                taskboard.storiesDone += (issue.fields.status.name === 'Closed' ? issue.fields[global.jiraPoints] : 0);
                                taskboard.storiesToDo += (issue.fields.status.name !== 'Closed' ? issue.fields[global.jiraPoints] : 0);
                            }
                        }
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (issue.fields.issuetype.subtask) {
                                stories[issue.fields.parent.key].tasks.push({
                                    assignee: issue.fields.assignee ? issue.fields.assignee.displayName : null,
                                    avatar: issue.fields.assignee ? issue.fields.assignee.avatarUrls["48x48"] : null,
                                    flagged: issue.fields[global.jiraFlagged] && issue.fields[global.jiraFlagged][0].value === 'Yes',
                                    key: issue.key,
                                    labels: issue.fields.labels.sort(),
                                    name: issue.fields.summary,
                                    state: issue.fields.status.name,
                                    type: issue.fields.issuetype.name
                                });
                                taskboard.tasksDone += (issue.fields.status.name === 'Closed' ? 1 : 0);
                                taskboard.tasksInProgress += (issue.fields.status.name !=='Open' && issue.fields.status.name !== 'Closed' ? 1 : 0);
                                taskboard.tasksToDo += (issue.fields.status.name === 'Open' ? 1 : 0);
                            }
                        }
                        for (var key in stories) {
                            if (stories.hasOwnProperty(key)) {
                                taskboard.stories.push(stories[key]);
                            }
                        }
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                var pool = [];
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\')', ['changelog', 'created', 'issuetype', 'subtasks', 'summary'], ['changelog'])
                    .then(function (data) {
                        for (var date = sprint.startDate.clone().endOf('day'); date.isBefore(sprint.endDate) || date.isSame(sprint.endDate); date.add(1, 'day')) {
                            for (var i = 0; i < data.issues.length; i++) {
                                var issue = data.issues[i];
                                if (!(issue.fields.issuetype.name === "Story" && issue.fields.subtasks.length > 0)) {
                                    for (var j = 0; j < issue.changelog.histories.length; j++) {
                                        var history = issue.changelog.histories[j];
                                        if (moment.max(moment.utc(history.created), sprint.startDate).isSame(date, 'day')) {
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
                        }
                        var burners = [];
                        for (var name in pool) {
                            if (pool.hasOwnProperty(name)) {
                                var days = [];
                                for (var date in pool[name]) {
                                    var tasks = [];
                                    for (var key in pool[name][date]) {
                                        if (pool[name][date].hasOwnProperty(key)) {
                                            tasks.push(extend({ key: key }, pool[name][date][key]));
                                        }
                                    }
                                    tasks.sort(sortBy("key"));
                                    if (pool[name].hasOwnProperty(date)) {
                                        days.push({
                                            date: date,
                                            tasks: tasks
                                        });
                                    }
                                }
                                burners.push({
                                    name: name,
                                    days: days
                                });
                            }
                        }
                        return {
                            startDate: sprint.startDate,
                            endDate: sprint.endDate,
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                var flow = [],
                    flowState = {
                        done: 0,
                        inProgress: 0,
                        toDo: 0
                    },
                    flowStates = [];
                for (var date = sprint.startDate.clone().add(-1, 'millisecond'); date.isBefore(sprint.endDate) || date.isSame(sprint.endDate); date.add(1, 'day')) {
                    flowStates[date] = {
                        done: 0,
                        inProgress: 0,
                        toDo: 0
                    };
                }
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\')', ['changelog', 'created', 'issuetype', 'subtasks'], ['changelog'])
                    .then(function (data) {
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (!(issue.fields.issuetype.name === "Story" && issue.fields.subtasks.length > 0)) {
                                issue.fields.created = moment.max(moment.utc(issue.fields.created), sprint.startDate.add(-1, "millisecond"));
                                flowStates[issue.fields.created.endOf('day')].toDo++;
                                for (var j = 0; j < issue.changelog.histories.length; j++) {
                                    var history = issue.changelog.histories[j];
                                    history.created = moment.max(moment.utc(history.created), sprint.startDate.add(-1, "millisecond"));
                                    history.items = history.items.filter(statusFilter);
                                    for (var k = 0; k < history.items.length; k++) {
                                        var item = history.items[k];
                                        if (item.fromString === 'Open') {
                                            flowStates[history.created.endOf('day')].inProgress++;
                                            flowStates[history.created.endOf('day')].toDo--;
                                        }
                                        if (item.toString === 'Closed') {
                                            flowStates[history.created.endOf('day')].done++;
                                            flowStates[history.created.endOf('day')].inProgress--;
                                        }
                                        if (item.fromString === 'Closed' && item.toString === 'Reopened') {
                                            flowStates[history.created.endOf('day')].done--;
                                            flowStates[history.created.endOf('day')].toDo++;
                                        }
                                    }
                                }
                            }
                        }
                        for (var date = sprint.startDate.clone().add(-1, 'millisecond'); date.isBefore(sprint.endDate) || date.isSame(sprint.endDate); date.add(1, 'day')) {
                            flowState.done += flowStates[date].done;
                            flowState.inProgress += flowStates[date].inProgress;
                            flowState.toDo += flowStates[date].toDo;
                            flow.push(extend({ date: date.clone() }, flowState));
                        }
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
        getSprint(Number(req.param('board')), Number(req.param('sprint')))
            .then(function (sprint) {
                return jql('sprint=' + req.param('sprint') + ' AND type in (\'Story\', \'Bug\', \'Internal Task\', \'External Task\') AND status was not \'Closed\' ON \'' + moment.min(moment.utc(), sprint.endDate).format('YYYY-MM-DD') + '\'', ['issuetype','labels','subtasks'])
                    .then(function (data) {
                        var count = [];
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (!(issue.fields.issuetype.name === "Story" && issue.fields.subtasks.length > 0)) {
                                var labels = issue.fields.labels.length === 0 ? '?' : issue.fields.labels.sort().join('/');
                                if (!count[labels]) {
                                    count[labels] = 0;
                                }
                                count[labels]++;
                            }
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
        getSprint(req.param('board'), req.param('sprint'))
            .then(function (sprint) {
                var remainingDays = 0,
                    totalDays = sprint.endDate.diff(sprint.startDate, 'days') + 1,
                    workingDays = 0;
                for (var date = sprint.startDate.clone(); date.isBefore(sprint.endDate); date.add(1, 'day')) {
                    if (date.isoWeekday() < 6) {
                        if (!date.isBefore(moment.utc().startOf('day'))) {
                            remainingDays++;
                        }
                        workingDays++;
                    }
                }
                return extend(sprint, {
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
        var burn = [],
            burnState = {
                done: 0,
                toDo: 0
            },
            burnStates = [],
            startDate = moment.utc().add(-90, 'days').startOf('day'),
            endDate = moment.utc().endOf('day');
        for (var date = startDate.clone().add(-1, 'millisecond'); date.isBefore(endDate) || date.isSame(endDate); date.add(1, 'day')) {
            burnStates[date] = {
                done: 0,
                toDo: 0
            };
        }
        jql('project=' + req.param('project') + ' AND type = \'Story\' AND status was not \'CLOSED\' BEFORE \'' + startDate.format('YYYY-MM-DD') + '\'', ['changelog', 'created'], ['changelog'], 999)
            .then(function (data) {
                for (var i = 0; i < data.issues.length; i++) {
                    var issue = data.issues[i];
                    issue.fields.created = moment.max(moment.utc(issue.fields.created), startDate.add(-1, "millisecond"));
                    burnStates[issue.fields.created.endOf('day')].toDo++;
                    for (var j = 0; j < issue.changelog.histories.length; j++) {
                        var history = issue.changelog.histories[j];
                        history.created = moment.max(moment.utc(history.created), startDate.add(-1, "millisecond"));
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
                for (var date = startDate.clone().add(-1, 'millisecond'); date.isBefore(endDate) || date.isSame(endDate); date.add(1, 'day')) {
                    burnState.done += burnStates[date].done;
                    burnState.toDo += burnStates[date].toDo;
                    burn.push(extend({ date: date.clone() }, burnState));
                }
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
        getSprint(req.param('board'), req.param('sprint'))
            .then(function (sprint) {
                return jql('project=' + req.param('project') + ' AND type = \'Story\' AND status = \'Open\' AND (sprint not in openSprints() OR sprint is EMPTY) ORDER BY Rank', [global.jiraFlagged, global.jiraPoints, 'labels', 'summary', 'status'], [], 999)
                    .then(function (data) {
                        var releaseboard =  [],
                            totalDays = sprint.endDate.diff(sprint.startDate, 'days') + 1;
                        for (var i = 0; i < data.issues.length; i++) {
                            var issue = data.issues[i];
                            if (releaseboard.length === 0 || (releaseboard[releaseboard.length - 1].points + (issue.fields[global.jiraPoints] || global.jiraPointsDefault) > Number(req.param('velocity')) * 1.10 && i > 0 && i < data.issues.length - 1)) {
                                releaseboard.push({
                                    startDate: sprint.startDate.clone().add((releaseboard.length + 1) * totalDays, 'days'),
                                    endDate: sprint.endDate.clone().add((releaseboard.length + 1) * totalDays, 'days'),
                                    points: 0,
                                    stories: []
                                });
                            }
                            releaseboard[releaseboard.length -1].stories.push({
                                flagged: (issue.fields[global.jiraFlagged] && issue.fields[global.jiraFlagged][0].value) === 'Yes',
                                key: issue.key,
                                labels: issue.fields.labels.sort(),
                                name: issue.fields.summary,
                                points: issue.fields[global.jiraPoints],
                                state: issue.fields.status.name
                            });
                            releaseboard[releaseboard.length-1].points += issue.fields[global.jiraPoints] || global.jiraPointsDefault;
                        }
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