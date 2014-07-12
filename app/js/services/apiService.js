'use strict';

angular.module('AgileTeamboard')
    .factory('apiService', ['$resource', function ($resource) {
        return {
            'boards': $resource('/api/boards'),
            'builds': $resource('/api/builds'),
            'configurations': $resource('/api/configurations/:configurationName'),
            'cycleboard': $resource('/api/:board/:sprint/cycle/board'),
            'projectburn': $resource('/api/:project/burn'),
            'projects': $resource('/api/projects'),
            'releaseboard': $resource('/api/:project/:board/:sprint/release/board/:velocity'),
            'sprintburn': $resource('/api/:board/:sprint/burn'),
            'sprints': $resource('/api/:board/sprints'),
            'taskboard': $resource('/api/:board/:sprint/task/board'),
            'taskburn': $resource('/api/:board/:sprint/task/burn'),
            'taskflow': $resource('/api/:board/:sprint/task/flow'),
            'taskwork': $resource('/api/:board/:sprint/task/work'),
            'timer': $resource('/api/:board/:sprint/timer')
        };
    }]);