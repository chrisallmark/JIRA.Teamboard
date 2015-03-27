/*
JIRA Teamboard - an electronic information radiator
Copyright (C) 2014 Chris Allmark

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program.  If not, see <http://www.gnu.org/licenses/>.
*/

angular.module('JIRA.Teamboard')
    .factory('apiService', ['$resource', function ($resource) {
        return {
            'backlogburn': $resource('/api/:backlog/burn'),
            'backlogs': $resource('/api/backlogs'),
            'boards': $resource('/api/boards'),
            'builds': $resource('/api/builds'),
            'configurations': $resource('/api/configurations/:configurationName'),
            'cycleboard': $resource('/api/:backlog/:board/:sprint/cycle/board'),
            'releaseboard': $resource('/api/:backlog/:board/:sprint/release/board/:velocity'),
            'results': $resource('/api/builds/results'),
            'sprintburn': $resource('/api/:backlog/:board/:sprint/burn/:timetrack'),
            'sprints': $resource('/api/:board/sprints'),
            'taskboard': $resource('/api/:backlog/:board/:sprint/task/board'),
            'taskburn': $resource('/api/:backlog/:board/:sprint/task/burn'),
            'taskflow': $resource('/api/:backlog/:board/:sprint/task/flow'),
            'taskwork': $resource('/api/:backlog/:board/:sprint/task/work'),
            'timer': $resource('/api/:board/:sprint/timer')
        };
    }]);