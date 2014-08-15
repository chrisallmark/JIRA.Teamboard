'use strict';

angular.module('JIRA.Teamboard')
    .controller('teamboardController', ['$scope', '$location', '$timeout', 'apiService', function ($scope, $location, $timeout, apiService) {
        var timeout;
        function startAnimation() {
            var element;
            var options = {'easing': 'linear', 'duration': 1000 * 60 * 2.5};
            switch($scope.teamboard.view) {
                case 'taskboard':
                    element = $('#taskboard');
                    element.scrollTop(0).animate({ 'scrollTop':element.get(0).scrollHeight - element.height() }, options);
                    break;
                case 'cycleboard':
                    element = $('#cycleboard');
                    element.scrollTop(0).animate({ 'scrollTop':element.get(0).scrollHeight - element.height() }, options);
                    break;
                case 'releaseboard':
                    element = $('#releaseboard');
                    element.scrollLeft(0).animate({ 'scrollLeft':element.get(0).scrollWidth - element.width() }, options);
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
                var now = moment.utc();
                if (now.isAfter(moment.utc(8, 'hh')) && now.isBefore(moment.utc(18, 'hh')) && now.isoWeekday() !== 6 && now.isoWeekday() !== 7) {
                    timeout = $timeout(load, 1000 * 60 * 2.5);
                } else {
                    timeout = $timeout(load, moment.utc().add(1, 'day').hour(8).startOf('hour').diff(now));
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
