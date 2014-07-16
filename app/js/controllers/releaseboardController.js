'use strict';

angular.module('AgileTeamboard')
    .controller('releaseboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state, type) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-') + ' ' + type.replace(/[^a-z0-9]/gi, '-'));
        }
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'releaseboard') {
                apiService.releaseboard.query({
                    'project': $scope.teamboard.project,
                    'board': $scope.teamboard.board,
                    'sprint': $scope.teamboard.sprint,
                    'velocity': $scope.teamboard.velocity,
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
            }
        });
    }]);