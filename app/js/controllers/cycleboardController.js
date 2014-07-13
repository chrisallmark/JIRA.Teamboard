'use strict';

angular.module('AgileTeamboard')
    .controller('cycleboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-') + (type ? ' ' + type.replace(/[^a-z0-9]/gi, '-') : ''));
        }
        function cycleDates(startDate, endDate) {
            var cycleDates = [];
            if (moment.isMoment(startDate) && moment.isMoment(endDate)) {
                var date = startDate.clone();
                while (date.isBefore(endDate, 'day') || date.isSame(endDate, 'day')) {
                    if (date.isoWeekday() !== 6 && date.isoWeekday() !== 7) {
                        cycleDates.push(date.clone());
                    }
                    date.add(1, 'day');
                }
            } else {
                throw "Not Moment";
            }
            return cycleDates;
        }
        function cycleTime(startDate, endDate) {
            var cycleTime = 0;
            if (moment.isMoment(startDate) && moment.isMoment(endDate)) {
                var date = startDate.clone();
                while (date.isBefore(endDate, 'day') || date.isSame(endDate, 'day')) {
                    cycleTime += (date.isoWeekday() === 6 || date.isoWeekday() === 7 ? 0 : 1);
                    date.add(1, 'day');
                }
            } else {
                throw "Not Moment";
            }
            return Math.max(cycleTime, 1);
        }
        function days(days, unit) {
            return days + ' day' + (days === 1 ? '' : 's') + (angular.isDefined(unit) ? '/' + unit : '');
        }
        function tag(assignee) {
            var names = assignee.split(/[\s-]+/);
            var initials = '';
            angular.forEach(names, function(name, i) {
                initials += name.charAt(0) + (i < names.length - 1 ? '.' : '');
            });
            return names[0].length > 7 ? initials : names[0];
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'cycleboard') {
                apiService.cycleboard.get({
                    'board': $scope.teamboard.board,
                    'sprint': $scope.teamboard.sprint
                }).$promise.then(function (cycleboard) {
                    cycleboard.endDate = moment.utc(cycleboard.endDate);
                    cycleboard.startDate = moment.utc(cycleboard.startDate);
                    cycleboard.cycleDates = cycleDates(cycleboard.startDate, cycleboard.endDate);
                    var cycleboardTime = cycleTime(cycleboard.startDate, cycleboard.endDate);
                    var cycleboardTimeTotal = 0;
                    angular.forEach(cycleboard.stories, function(story) {
                        story.classification = classification(story.flagged, story.labels, story.state);
                        story.endDate = moment.utc(story.endDate);
                        story.startDate = moment.utc(story.startDate);
                        var storyCycleTime = cycleTime(story.startDate, story.endDate);
                        story.style = {
                            'margin-left': (cycleTime(cycleboard.startDate, story.startDate) - 1) * (100 / cycleboardTime) + '%',
                            'width': storyCycleTime * (100 / cycleboardTime) + '%'
                        };
                        var storyCycleTotal = 0;
                        angular.forEach(story.tasks, function(task) {
                            task.endDate = moment.utc(task.endDate);
                            task.startDate = moment.utc(task.startDate);
                            task.classification = classification(task.flagged,task.labels, task.state, task.type);
                            var taskCycleTime = cycleTime(task.startDate, task.endDate);
                            task.cycleTime = taskCycleTime;
                            task.style = {
                                'margin-left': (cycleTime(story.startDate, task.startDate) - 1) * (100 / storyCycleTime) + '%',
                                'width': taskCycleTime * (100 / storyCycleTime) + '%'
                            };
                            if (task.assignee) {
                                task.tag = tag(task.assignee);
                            }
                            storyCycleTotal += taskCycleTime;
                        });
                        story.cycleTimeAverage = days(story.tasks.length === 0 ? 0 : (storyCycleTotal / story.tasks.length).toFixed(2), 'task');
                        story.cycleTime = days(storyCycleTime);
                        cycleboardTimeTotal += storyCycleTime;
                    });
                    cycleboard.cycleTimeAverage = days(cycleboard.stories.length === 0 ? 0 : (cycleboardTimeTotal / cycleboard.stories.length).toFixed(2), 'story');
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
            $('#cycleboard .story, #cycleboard .task').popover({
                'container': 'body',
                'html': true,
                'toggle': 'popover',
                'trigger': 'hover'
            });
        };
    }]);