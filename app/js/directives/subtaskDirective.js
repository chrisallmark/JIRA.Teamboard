angular.module('JIRA.Teamboard')
    .directive('subtask', function () {
        return {
            'replace': true,
            'restrict': 'E',
            'templateUrl': '/templates/subtask.html'
        };
    });
