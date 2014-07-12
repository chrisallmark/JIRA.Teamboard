'use strict';

angular.module('AgileTeamboard')
    .controller('helpController', ['$scope', '$location', function ($scope, $location) {
        $scope.baseUrl = $location.protocol() + '://' + $location.host() + ($location.port() === 80 ? '' : ':' + $location.port());
        $scope.builds = [
            {
                'classification': "inprogress",
                'name': "Buld #3",
                'startDate': moment().calendar()
            },
            {
                'classification': "successful",
                'name': "Buld #2",
                'startDate': moment().add(-1, 'days').calendar()
            },
            {
                'classification': "failed",
                'name': "Buld #1",
                'startDate': moment().add(-2, 'days').calendar()
            }
        ];
        $scope.scrollTo = function(id) {
            $('#help-content').animate({'scrollTop': $('#help-content').scrollTop() + $(id).position().top - 20}, 1000);
        };
    }]);
