'use strict';
angular.module('JIRA.Teamboard')
    .directive('build', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/build.html'
        };
    });
