'use strict';
angular.module('AgileTeamboard')
    .directive('story', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/story.html'
        };
    });
