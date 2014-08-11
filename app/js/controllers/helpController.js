'use strict';

angular.module('JIRA.Teamboard')
    .controller('helpController', ['$scope', '$location', function ($scope, $location) {
        $scope.baseUrl = $location.protocol() + '://' + $location.host() + ($location.port() === 80 ? '' : ':' + $location.port());
        $scope.builds = [
            {
                branch: true,
                classification: 'in-progress',
                duration: '0s',
                name: 'Buld #3',
                rating: '???',
                end: moment()
            },
            {
                branch: false,
                classification: 'successful',
                duration: '456s',
                name: 'Buld #2',
                rating: '100%',
                end: moment().add(-1, 'days'),
                tests: {
                    failed: 0,
                    passed: 1
                }
            },
            {
                branch: true,
                classification: 'failed',
                duration: '123s',
                name: 'Buld #1',
                rating: '0%',
                end: moment().add(-2, 'days'),
                tests: {
                    failed: 1,
                    passed: 0
                }
            }
        ];
        $scope.scrollTo = function(id) {
            $('#help-content').animate({'scrollTop': $('#help-content').scrollTop() + $(id).position().top - 20}, 1000);
        };
    }]);
