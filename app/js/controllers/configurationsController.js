'use strict';

angular.module('AgileTeamboard')
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

