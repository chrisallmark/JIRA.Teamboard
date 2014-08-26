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
    .controller('teamboardController', ['$scope', '$location', '$timeout', 'apiService', function ($scope, $location, $timeout, apiService) {
        var timeout;
        function startAnimation() {
            var element;
            switch($scope.teamboard.view) {
                case 'taskboard':
                    element = $('#taskboard');
                    element.scrollTop(0).animate({ 'scrollTop':element.get(0).scrollHeight - element.height() }, 1000 * 60 * 2.5, 'linear');
                    break;
                case 'cycleboard':
                    element = $('#cycleboard');
                    element.scrollTop(0).animate({ 'scrollTop':element.get(0).scrollHeight - element.height() }, 1000 * 60 * 2.5, 'linear');
                    break;
                case 'releaseboard':
                    element = $('#releaseboard');
                    element.scrollLeft(0).animate({ 'scrollLeft':element.get(0).scrollWidth - element.width() }, 1000 * 60 * 2.5, 'linear');
                    break;
            }
        }
        function stopAnimation() {
            $('#taskboard,#cycleboard,#releaseboard').stop();
        }
        $scope.configure = function () {
            $location.path('/configuration' + $location.path());
        };
        $scope.load = function(view) {
            $scope.teamboard.view = view;
            if ($scope.teamboard.animate) {
                stopAnimation();
            }
        };
        $scope.toggleSlideshow = function() {
            $scope.teamboard.slideshow = !$scope.teamboard.slideshow;
            if ($scope.teamboard.animate) {
                stopAnimation();
            }
        };
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.$watch('teamboard.loaded', function(newValue, oldValue) {
            if (newValue !== oldValue && $scope.teamboard.view === $scope.teamboard.loaded && $scope.teamboard.slideshow && $scope.teamboard.animate) {
                $timeout(startAnimation, 100);
            }
        });
        apiService.configurations.get({'configurationName':$location.path().substr(1)}).$promise.then(function (configuration) {
            $scope.teamboard = configuration;
            (function load() {
                if ($scope.teamboard.slideshow) {
                    if ($scope.teamboard.view === $scope.teamboard.loaded) {
                        switch ($scope.teamboard.view) {
                            case 'dashboard':
                                $scope.load('taskboard');
                                break;
                            case 'taskboard':
                                $scope.load('cycleboard');
                                break;
                            case 'cycleboard':
                                $scope.load($scope.teamboard.velocity ? 'releaseboard' : 'dashboard');
                                break;
                            case 'releaseboard':
                                $scope.load('dashboard');
                                break;
                            default:
                                $scope.load(angular.lowercase($location.search().view || 'dashboard'));
                                break;
                        }
                    }
                } else {
                    $scope.load(angular.isDefined($scope.teamboard.view) ? 'reload' : angular.lowercase($location.search().view || 'dashboard'));
                }
                var now = moment();
                if (now.isAfter(moment(8, 'hh')) && now.isBefore(moment(18, 'hh')) && now.isoWeekday() !== 6 && now.isoWeekday() !== 7) {
                    timeout = $timeout(load, 1000 * 60 * 2.5);
                } else {
                    timeout = $timeout(load, moment().add(now.isBefore(moment(8, 'hh')) ? 0 : 1, 'day').hour(8).startOf('hour').diff(now));
                }
            })();
        }, function(error) {
            if (error.status === 404) {
                $location.path('/');
            } else {
                throw error.status + " " + error.data;
            }
        });
    }]);
