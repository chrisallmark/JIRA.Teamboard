'use strict';
angular.module('AgileTeamboard')
    .directive('subtask', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/subtask.html'
        };
    });
