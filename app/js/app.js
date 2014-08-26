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
