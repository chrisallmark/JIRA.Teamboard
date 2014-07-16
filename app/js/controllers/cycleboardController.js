'use strict';

angular.module('AgileTeamboard')
    .controller('cycleboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-') + ' ' + type.replace(/[^a-z0-9]/gi, '-'));
        }
        function cycleDates(start, end) {
            var cycleDates = [];
            if (moment.isMoment(start) && moment.isMoment(end)) {
                var date = start.clone();
                while (date.isBefore(end, 'day') || date.isSame(end, 'day')) {
                    if (date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
                        cycleDates.push(date.clone());
                    }
                    date.add(1, 'day');
                }
            }
            return cycleDates;
        }
        function cycleTime(start, end) {
            var cycleTime = 0;
            if (moment.isMoment(start) && moment.isMoment(end)) {
                var date = start.clone();
                while (date.isBefore(end, 'day') || date.isSame(end, 'day')) {
                    cycleTime += (date.isoWeekday() === 6 || date.isoWeekday() === 7 ? 0 : 1);
                    date.add(1, 'day');
                }
            }
            return Math.max(cycleTime, 1);
        }
        function days(days, unit) {
            return days + ' day' + (days === 1 ? '' : 's') + (angular.isDefined(unit) ? '/' + unit : '');
        }
        function popover(subtask) {
            var popover = '';
            if (subtask) {
                popover += '<strong>' + subtask.key + '</strong> / ' + subtask.name + ' Transitions / <strong>' + subtask.assignee + ' </strong><hr/><table>';
                angular.forEach(subtask.transitions, function(transition, index) {
                    popover += '<tr><td>' + moment.utc(transition.date).format('YYYY-MM-DD @ HH:mm') + '</td><td>' + transition.fromState + ' &rarr; ' + transition.toState + '</td></tr>';
                });
                popover += '</table>';
            }
            return popover;
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'cycleboard') {
                apiService.cycleboard.get({
                    'board': $scope.teamboard.board,
                    'sprint': $scope.teamboard.sprint
                }).$promise.then(function (cycleboard) {
                    cycleboard.start = moment.utc(cycleboard.start);
                    cycleboard.end = moment.utc(cycleboard.end);
                    cycleboard.cycleDates = cycleDates(cycleboard.start, cycleboard.end);
                    var cycleboardTime = cycleTime(cycleboard.start, cycleboard.end);
                    var cycleboardTimeTotal = 0;
                    angular.forEach(cycleboard.issues, function(issue) {
                        issue.start = moment.utc(issue.start);
                        issue.end = moment.utc(issue.end);
                        issue.classification = classification(issue.flagged, issue.labels, issue.state, issue.type);
                        var issueCycleTime = cycleTime(issue.start, issue.end);
                        issue.style = {
                            'margin-left': (cycleTime(cycleboard.start, issue.start) - 1) * (100 / cycleboardTime) + '%',
                            'width': issueCycleTime * (100 / cycleboardTime) + '%'
                        };
                        var issueCycleTotal = 0;
                        angular.forEach(issue.subtasks, function(subtask) {
                            subtask.start = moment.utc(subtask.start);
                            subtask.end = moment.utc(subtask.end);
                            subtask.classification = classification(subtask.flagged,subtask.labels, subtask.state, subtask.type);
                            var subtaskCycleTime = cycleTime(subtask.start, subtask.end);
                            subtask.cycleTime = subtaskCycleTime;
                            subtask.popover = popover(subtask);
                            subtask.style = {
                                'margin-left': (cycleTime(issue.start, subtask.start) - 1) * (100 / issueCycleTime) + '%',
                                'width': subtaskCycleTime * (100 / issueCycleTime) + '%'
                            };
                            issueCycleTotal += subtaskCycleTime;
                        });
                        issue.cycleTimeAverage = days(issue.subtasks.length === 0 ? 0 : (issueCycleTotal / issue.subtasks.length).toFixed(2), 'task');
                        issue.cycleTime = days(issueCycleTime);
                        cycleboardTimeTotal += issueCycleTime;
                    });
                    cycleboard.cycleTimeAverage = days(cycleboard.issues.length === 0 ? 0 : (cycleboardTimeTotal / cycleboard.issues.length).toFixed(2), 'issue');
                    cycleboard.cycleTime = days(cycleboardTime);
                    cycleboard.style = {
                        'width': (100 / cycleboardTime) + '%'
                    };
                    $scope.cycleboard = cycleboard;
                }).finally(function () {
                    $scope.teamboard.loaded = $scope.teamboard.view;
                });
            }
        });
        $scope.popover = function () {
            $('#cycleboard .issue, #cycleboard .task').popover({
                'container': 'body',
                'html': true,
                'toggle': 'popover',
                'trigger': 'hover'
            });
        };
    }]);