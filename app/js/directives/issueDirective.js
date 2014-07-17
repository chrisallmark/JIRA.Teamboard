'use strict';
angular.module('JIRA.Teamboard')
    .directive('issue', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/issue.html'
        };
    });
