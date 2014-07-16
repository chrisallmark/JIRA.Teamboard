'use strict';

angular.module('AgileTeamboard')
    .controller('taskboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-') + ' ' + type.replace(/[^a-z0-9]/gi, '-'));
        }
        function tag(assignee) {
            if (assignee) {
                var names = assignee.split(/[\s-]+/);
                var initials = '';
                angular.forEach(names, function (name, i) {
                    initials += name.charAt(0) + (i < names.length - 1 ? '.' : '');
                });
                return names[0].length > 8 ? initials : names[0];
            }
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'taskboard') {
                apiService.taskboard.get({
                    board: $scope.teamboard.board,
                    sprint: $scope.teamboard.sprint
                }).$promise.then(function (taskboard) {
                    taskboard.start = moment.utc(taskboard.start).format("ddd Do");
                    taskboard.end = moment.utc(taskboard.end).format("ddd Do");
                    var wip = 0;
                    angular.forEach(taskboard.issues, function(issue) {
                        issue.classification = classification(issue.flagged, issue.labels, issue.state, issue.type);
                        angular.forEach(issue.subtasks, function(subtask) {
                            subtask.classification = classification(subtask.flagged, subtask.labels, subtask.state, subtask.type);
                            subtask.tag = tag(subtask.assignee);
                            wip += (subtask.state !== "Open" && subtask.state !== "Closed");
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