'use strict';

angular.module('AgileTeamboard')
    .controller('teamboardController', ['$scope', '$location', '$timeout', 'apiService', function ($scope, $location, $timeout, apiService) {
        var timeout;
        function startAnimation() {
            var element;
            var options = {'easing': 'linear', 'duration': 1000 * 60 * 2.5};
            switch($scope.teamboard.view) {
                case 'taskboard':
                    element = $('#taskboard');
                    element.scrollTop(0).animate({'scrollTop':element.get(0).scrollHeight}, options);
                    break;
                case 'cycleboard':
                    element = $('#cycleboard');
                    element.scrollTop(0).animate({'scrollTop':element.get(0).scrollHeight}, options);
                    break;
                case 'releaseboard':
                    element = $('#releaseboard');
                    element.scrollLeft(0).animate({'scrollLeft':element.get(0).scrollWidth}, options);
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
            $('.popover').popover('hide');
            $scope.teamboard.view = view;
            stopAnimation();
        };
        $scope.toggleSlideshow = function() {
            $scope.teamboard.slideshow = !$scope.teamboard.slideshow;
            if (!$scope.teamboard.slideshow) {
                stopAnimation();
            }
        };
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.$watch('teamboard.loaded', function(newValue, oldValue) {
            if (newValue !== oldValue && $scope.teamboard.view === $scope.teamboard.loaded && $scope.teamboard.slideshow) {
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
                    if (!angular.isDefined($scope.teamboard.view)) {
                        $scope.load(angular.lowercase($location.search().view || 'dashboard'));
                    }
                }
                timeout = $timeout(load, 1000 * 60 * 2.5);
            })();
        }, function(error) {
            if (error.status === 404) {
                $location.path('/');
            } else {
                throw error.status + " " + error.data;
            }
        });
    }]);
