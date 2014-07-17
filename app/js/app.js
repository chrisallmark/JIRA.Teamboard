'use strict';
angular.module('JIRA.Teamboard', ['ngResource', 'ngRoute'])
    .config(['$locationProvider', '$routeProvider', function ($locationProvider, $routeProvider) {
        $locationProvider.html5Mode(true);
        $routeProvider.when('/configurations', {
            'templateUrl':'/views/configurations.html'
        });
        $routeProvider.when('/configuration/:configurationName?', {
            'templateUrl':'/views/configuration.html'
        });
        $routeProvider.when('/:name', {
            'templateUrl':'/views/teamboard.html'
        });
        $routeProvider.otherwise({
            'redirectTo':'/configurations'
        });
    }])
    .run(['$rootScope', '$location', function ($rootScope, $location) {
        var history = [];
        $rootScope.back = function() {
            var previousUrl = history.length > 1 ? history.splice(-2)[0] : '/';
            $location.path(previousUrl);
        };
        $rootScope.$on('$routeChangeSuccess', function () {
            history.push($location.$$path);
        });
    }]);
