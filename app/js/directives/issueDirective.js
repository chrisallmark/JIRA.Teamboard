'use strict';
angular.module('AgileTeamboard')
    .directive('issue', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/issue.html'
        };
    });
