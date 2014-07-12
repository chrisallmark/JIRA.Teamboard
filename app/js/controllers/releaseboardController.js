'use strict';

angular.module('AgileTeamboard')
    .controller('releaseboardController', ['$scope', 'apiService', function ($scope, apiService) {
        function classification(flagged, labels, state) {
            return angular.lowercase((flagged ? 'block ' : '') + (labels ? labels.join('-') + ' ' : '') + state.replace(/[^a-z0-9]/gi, '-'));
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
                        sprint.endDate = moment.utc(sprint.endDate).format("MMM Do");
                        sprint.overallocated = sprint.points > $scope.teamboard.velocity * 1.25;
                        sprint.startDate = moment.utc(sprint.startDate).format("MMM Do");
                        sprint.underallocated = sprint.points < $scope.teamboard.velocity * 0.75;
                        angular.forEach(sprint.stories, function(story) {
                            story.classification = classification(story.flagged, story.labels, story.state);
                        });
                    });
                    $scope.releaseboard = releaseboard;
                }).finally(function () {
                    $scope.teamboard.loaded = $scope.teamboard.view;
                });
            }
        });
    }]);