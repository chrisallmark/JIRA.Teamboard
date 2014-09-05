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

angular.module('JIRA.Teamboard')
    .controller('taskboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'jira-flagged ' : '') + (labels.length > 0 ? 'jira-label-' + labels.join('-') + ' ' : '') + 'jira-state-' + state.replace(/[^a-z0-9]/gi, '-') + ' jira-type-' + type.replace(/[^a-z0-9]/gi, '-'));
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
            if (angular.isDefined($scope.teamboard)) {
                if ($scope.teamboard.view === 'taskboard') {
                    apiService.taskboard.get({
                        board: $scope.teamboard.board,
                        sprint: $scope.teamboard.sprint
                    }).$promise.then(function (taskboard) {
                            taskboard.start = moment.utc(taskboard.start).format("ddd Do");
                            taskboard.end = moment.utc(taskboard.end).format("ddd Do");
                            var wip = 0;
                            angular.forEach(taskboard.issues, function (issue) {
                                issue.classification = classification(issue.flagged, issue.labels, issue.state, issue.type);
                                angular.forEach(issue.subtasks, function (subtask) {
                                    subtask.classification = classification(subtask.flagged, subtask.labels, subtask.state, subtask.type);
                                    subtask.tag = tag(subtask.assignee);
                                    wip += (subtask.state !== "Open" && subtask.state !== "Closed");
                                });
                            });
                            taskboard.state = null;
                            taskboard.wipExceeded = Number($scope.teamboard.wip) > 0 ? wip > Number($scope.teamboard.wip) : false;
                            $scope.taskboard = taskboard;
                        }).finally(function () {
                            $scope.teamboard.loaded = $scope.teamboard.view;
                        });
                } else if ($scope.teamboard.loaded === 'taskboard' && $scope.teamboard.view === 'reload') {
                    $scope.teamboard.view = $scope.teamboard.loaded;
                } else {
                    $('#taskboard').scrollTop(0);
                }
            }
        });
    }]);