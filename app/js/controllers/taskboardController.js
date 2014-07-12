'use strict';

angular.module('AgileTeamboard')
    .controller('taskboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-') + (type ? ' ' + type.replace(/[^a-z0-9]/gi, '-') : ''));
        }
        function tag(assignee) {
            var names = assignee.split(/[\s-]+/);
            var initials = '';
            angular.forEach(names, function(name, i) {
                initials += name.charAt(0) + (i < names.length - 1 ? '.' : '');
            });
            return names[0].length > 8 ? initials : names[0];
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'taskboard') {
                apiService.taskboard.get({
                    board: $scope.teamboard.board,
                    sprint: $scope.teamboard.sprint
                }).$promise.then(function (taskboard) {
                    taskboard.endDate = moment.utc(taskboard.endDate).format("ddd Do");
                    taskboard.startDate = moment.utc(taskboard.startDate).format("ddd Do");
                    var wip = 0;
                    angular.forEach(taskboard.stories, function(story) {
                        story.classification = classification(story.flagged, story.labels, story.state);
                        angular.forEach(story.tasks, function(task) {
                            task.classification = classification(task.flagged, task.labels, task.state, task.type);
                            if (task.assignee) {
                                task.tag = tag(task.assignee);
                            }
                            wip += (task.state !== "Open" && task.state !== "Closed");
                        });
                    });
                    taskboard.wipExceeded = Number($scope.teamboard.wip) > 0 ? wip > Number($scope.teamboard.wip) : false;
                    $scope.taskboard = taskboard;
                }).finally(function () {
                    $scope.teamboard.loaded = $scope.teamboard.view;
                });
            }
        });
    }]);