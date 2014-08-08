'use strict';

angular.module('JIRA.Teamboard')
    .factory('apiService', ['$resource', function ($resource) {
        return {
            'backlogburn': $resource('/api/:backlog/burn'),
            'backlogs': $resource('/api/backlogs'),
            'boards': $resource('/api/boards'),
            'builds': $resource('/api/builds'),
            'configurations': $resource('/api/configurations/:configurationName'),
            'cycleboard': $resource('/api/:board/:sprint/cycle/board'),
            'releaseboard': $resource('/api/:backlog/:board/:sprint/release/board/:velocity'),
            'results': $resource('/api/builds/results'),
            'sprintburn': $resource('/api/:board/:sprint/burn'),
            'sprints': $resource('/api/:board/sprints'),
            'taskboard': $resource('/api/:board/:sprint/task/board'),
            'taskburn': $resource('/api/:board/:sprint/task/burn'),
            'taskflow': $resource('/api/:board/:sprint/task/flow'),
            'taskwork': $resource('/api/:board/:sprint/task/work'),
            'timer': $resource('/api/:board/:sprint/timer')
        };
    }]);