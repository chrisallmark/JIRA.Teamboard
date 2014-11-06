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
    .controller('configurationsController', ['$scope', '$location', 'apiService', function ($scope, $location, apiService) {
        $scope.add = function () {
            $location.path('/configuration/');
        };
        $scope.delete = function (configurationName) {
            apiService.configurations.delete({'configurationName': configurationName});
            $scope.configurations = apiService.configurations.query();
        };
        $scope.edit = function (configurationName) {
            $location.path('/configuration/' + configurationName);
        };
        $scope.view = function (configurationName) {
            $location.path('/' + configurationName);
        };
        $scope.configurations = apiService.configurations.query();
    }]);

