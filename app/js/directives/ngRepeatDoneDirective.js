angular.module('JIRA.Teamboard')
    .directive('ngRepeatDone', function () {
        return {
            'link': function (scope, element, attrs) {
                if (scope.$last === true) {
                    scope.$evalAsync(attrs.ngRepeatDone);
                }
            },
            'restrict': 'A'
        };
    });
