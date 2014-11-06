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
    .controller('releaseboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'jira-flagged ' : '') + (labels.length > 0 ? 'jira-label-' + labels.join('-') + ' ' : '') + ' jira-state-' + state.replace(/[^a-z0-9]/gi, '-') + ' jira-type-' + type.replace(/[^a-z0-9]/gi, '-'));
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard)) {
                if ($scope.teamboard.view === 'releaseboard') {
                    apiService.releaseboard.query({
                        'backlog': $scope.teamboard.backlog,
                        'board': $scope.teamboard.board,
                        'sprint': $scope.teamboard.sprint,
                        'velocity': $scope.teamboard.velocity
                    }).$promise.then(function (releaseboard) {
                        angular.forEach(releaseboard, function(sprint) {
                            sprint.start = moment.utc(sprint.start).format("MMM Do");
                            sprint.end = moment.utc(sprint.end).format("MMM Do");
                            angular.forEach(sprint.issues, function(issue) {
                                issue.classification = classification(issue.flagged, issue.labels, issue.state, issue.type);
                            });
                            sprint.overallocated = sprint.points > $scope.teamboard.velocity * 1.25;
                            sprint.underallocated = sprint.points < $scope.teamboard.velocity * 0.75;
                        });
                        $scope.releaseboard = releaseboard;
                    }).finally(function () {
                        $scope.teamboard.loaded = $scope.teamboard.view;
                    });
                } else if ($scope.teamboard.loaded === 'releaseboard' && $scope.teamboard.view === 'reload') {
                    $scope.teamboard.view = $scope.teamboard.loaded;
                } else {
                    $('#releaseboard').scrollLeft(0).scrollTop(0);
                }
            }
        });
    }]);