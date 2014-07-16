'use strict';
angular.module('AgileTeamboard')
    .directive('task', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/subtask.html'
        };
    });
