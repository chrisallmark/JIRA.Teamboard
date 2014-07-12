'use strict';
angular.module('AgileTeamboard')
    .directive('build', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/build.html'
        };
    });
