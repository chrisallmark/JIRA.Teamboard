'use strict';

angular.module('JIRA.Teamboard')
    .factory('chartService', ['$q', 'apiService', function ($q, apiService) {
        function defaultOptions() {
            return {
                backgroundColor: '#111',
                chartArea: {
                    height: '95%',
                    width: '95%'
                },
                hAxis: {
                    gridlines: {
                        color: '#333',
                        count: -1
                    },
                    textPosition: 'none'
                },
                legend: {
                    alignment: 'center',
                    position: 'in',
                    textStyle: {
                        color: '#fff'
                    }
                },
                lineWidth: 4,
                vAxis: {
                    gridlines: {
                        color: '#333',
                        count: 10
                    },
                    textPosition: 'none'
                }
            };
        }
        return {
            'sprintburn': function(configuration) {
                var deferred = $q.defer();
                var sprintburn = apiService.sprintburn.query({
                    board: configuration.board,
                    sprint: configuration.sprint
                });
                sprintburn.$promise.then(function (sprintburn) {
                    var data = new google.visualization.DataTable();
                    data.addColumn('number', 'Day');
                    data.addColumn('number', 'To Do');
                    data.addColumn('number', 'Done');
                    angular.forEach(sprintburn, function(burn, index) {
                        burn.date = moment.utc(burn.date);
                        if (index === 0 || burn.date.isoWeekday() <= 5) {
                            data.addRow([
                                {v: data.getNumberOfRows(), f: (index === 0 ? '-' : burn.date.format('dddd Do'))},
                                burn.toDo + burn.done,
                                burn.date.isBefore(moment.utc().endOf('day')) || burn.date.isSame(moment.utc().endOf('day')) ? burn.done : null
                        ]);
                        }
                    });
                    var options = $.extend(true, defaultOptions(), {
                        colors: ['#36c', '#f90'],
                        hAxis: {
                            viewWindow: {
                                max: data.getNumberOfRows() - 1
                            }
                        },
                        trendlines: {
                            1: {
                                labelInLegend: 'Forecast',
                                pointSize: 1
                                }
                        },
                        vAxis: {
                            viewWindow: {
                                min: 0
                            }
                        }
                    });
                    deferred.resolve({'data':data, 'options':options});
                }, function(reason) {
                    deferred.reject(reason);
                });
                return deferred.promise;
            },
            'backlogburn': function(configuration) {
                var deferred = $q.defer();
                var backlogburn = apiService.backlogburn.query({
                    'backlog': configuration.backlog
                });
                backlogburn.$promise.then(function (backlogburn) {
                    var data = new google.visualization.DataTable();
                    data.addColumn('number', 'Date');
                    data.addColumn('number', 'To Do');
                    data.addColumn('number', 'Done');
                    angular.forEach(backlogburn, function(day) {
                        day.date = moment.utc(day.date);
                        data.addRow([
                            {v: data.getNumberOfRows(), f: day.date.format('Do MMM YYYY')},
                            day.toDo + day.done,
                                day.date <= moment.utc().endOf('day') ? day.done : null
                        ]);
                    });
                    var options = $.extend(true, defaultOptions(), {
                        colors: ['#dc3912', '#109618'],
                        trendlines: {
                            0: {
                                labelInLegend: 'To Do Forecast',
                                pointSize: 1
                            },
                            1: {
                                labelInLegend: 'Done Forecast',
                                pointSize: 1
                            }
                        }
                    });
                    deferred.resolve({'data':data, 'options':options});
                }, function(reason) {
                    deferred.reject(reason);
                });
                return deferred.promise;
            },
            'taskburn': function(configuration) {
                var deferred = $q.defer();
                var taskburn = apiService.taskburn.get({
                    board: configuration.board,
                    sprint: configuration.sprint
                });
                taskburn.$promise.then(function (taskburn) {
                    taskburn.start = moment.utc(taskburn.start);
                    taskburn.end = moment.utc(taskburn.end);
                    var data = new google.visualization.DataTable();
                    data.addColumn('string', 'Day');
                    angular.forEach(taskburn.burners, function(burner, index) {
                        data.addColumn('number', burner.name === '' ? '?' : burner.name.split(' ')[0]);
                        data.addColumn({'type': 'string', 'role': 'tooltip', p: {'html': true}});
                        var row = 0;
                        var date = moment.utc(taskburn.start.endOf('day'));
                        while (date.isBefore(taskburn.end, 'day') || date.isSame(taskburn.end, 'day')) {
                            if (date.isoWeekday() <= 5) {
                                if (index === 0) {
                                    data.setCell(data.addRow(), 0, date.format('dddd Do'));
                                }
                                var day;
                                for (var i = 0; i < burner.days.length; i++) {
                                    day = burner.days[i];
                                    if (!moment.isMoment(day.date)) {
                                        day.date = moment.utc(day.date);
                                    }
                                    if (day.date.isSame(date, 'day')) {
                                        break;
                                    }
                                }
                                if (day && day.date.isSame(date, 'day')) {
                                    data.setCell(row, (index * 2) + 1, day.subtasks.length);
                                    var tooltip = '<div class="task-tooltip"><strong>' + day.date.format('dddd Do') + '</strong><hr/><table>';
                                    angular.forEach(day.subtasks, function(subtask, index) {
                                        tooltip += '<tr><td>' + subtask.key + '</td><td><strong>' + subtask.name + '</strong><br/>';
                                        angular.forEach(subtask.transitions, function(transition, index) {
                                            tooltip += (index === 0 || subtask.transitions[index - 1].toState !== transition.fromState ? (index === 0 ? '' : ', ') + transition.fromState : '') + ' &rarr; ' + transition.toState;
                                        });
                                    });
                                    tooltip += '</td></tr></table><small>' + burner.name + ' </small></div>';
                                    data.setCell(row, (index * 2) + 2, tooltip);
                                }
                                else {
                                    data.setCell(row, (index * 2) + 1, null);
                                    data.setCell(row, (index * 2) + 2, null);
                                }
                                row++;
                            }
                            date.add('days', 1);
                        }
                    });
                    if (data.getNumberOfRows() !== 0) {
                        var options = $.extend(true, defaultOptions(), {
                            hAxis: {
                                gridlines: {
                                    count: 0
                                },
                                viewWindow: {
                                    max: data.getNumberOfRows()
                                }
                            },
                            isStacked: true,
                            tooltip: {
                                isHtml: true
                            }
                        });
                        deferred.resolve({'data': data, 'options': options});
                    }
                }, function(reason) {
                    deferred.reject(reason);
                });
                return deferred.promise;
            },
            'taskflow': function(configuration) {
                var deferred = $q.defer();
                var taskflow = apiService.taskflow.query({
                    board: configuration.board,
                    sprint: configuration.sprint
                });
                taskflow.$promise.then(function (taskflow) {
                    var data = new google.visualization.DataTable();
                    data.addColumn('number', 'Day');
                    data.addColumn('number', 'Done');
                    data.addColumn('number', 'In Progress');
                    data.addColumn('number', 'To Do');
                    angular.forEach(taskflow, function(flow, index) {
                        flow.date = moment.utc(flow.date);
                        if (index === 0 || flow.date.isoWeekday() <= 5) {
                            data.addRow([
                                {v: data.getNumberOfRows(), f: (index === 0 ? '-' : flow.date.format('dddd Do'))},
                                flow.done,
                                flow.inProgress,
                                flow.toDo
                            ]);
                        }
                    });
                    var options = $.extend(true, defaultOptions(), {
                        colors: ['#109618', '#f90', '#dc3912'],
                        isStacked: true
                    });
                    deferred.resolve({'data':data, 'options':options});
                }, function(reason) {
                    deferred.reject(reason);
                });
                return deferred.promise;
            },
            'taskwork': function(configuration) {
                var deferred = $q.defer();
                var taskwork = apiService.taskwork.query({
                    board: configuration.board,
                    sprint: configuration.sprint,
                    labels: configuration.labels
                });
                taskwork.$promise.then(function (taskwork) {
                    var data = new google.visualization.DataTable();
                    data.addColumn('string', 'Category');
                    data.addColumn('number', 'Work');
                    angular.forEach(taskwork, function(item) {
                        data.addRow([item.category, item.work]);
                    });
                    if (data.getNumberOfRows() !== 0) {
                        var options = $.extend(true, defaultOptions(), {
                            chartArea: {
                                height: '85%'
                            },
                            is3D: true,
                            legend: {
                                position: 'top'
                            },
                            pieSliceText: 'value'
                        });
                        deferred.resolve({'data': data, 'options': options});
                    }
                }, function(reason) {
                    deferred.reject(reason);
                });
                return deferred.promise;
            }
        };
    }]);