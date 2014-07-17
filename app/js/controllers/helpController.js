'use strict';

angular.module('JIRA.Teamboard')
    .controller('helpController', ['$scope', '$location', function ($scope, $location) {
        $scope.baseUrl = $location.protocol() + '://' + $location.host() + ($location.port() === 80 ? '' : ':' + $location.port());
        $scope.builds = [
            {
                classification: "successful",
                name: "Buld #2",
                rating: '100%',
                start: moment().add(-1, 'days').calendar(),
                tests: {
                    failed: 0,
                    passed: 1
                }
            },
            {
                classification: "failed",
                name: "Buld #1",
                rating: '0%',
                start: moment().add(-2, 'days').calendar(),
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
