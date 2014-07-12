'use strict';

angular.module('AgileTeamboard')
    .controller('buildController', ['$scope', '$timeout', 'apiService', function ($scope, $timeout, apiService) {
        function classification(status) {
            return angular.lowercase(status.replace(/[^a-z0-9]/gi, '_'));
        }
        var timeout;
        (function load() {
            apiService.builds.query().$promise.then(function (builds) {
                angular.forEach(builds, function(build) {
                    build.classification = classification(build.status);
                    build.endDate = moment(build.endDate).calendar();
                    if (build.tests.failed === 0 && build.tests.passed === 0) {
                        build.rating = 'N/A';
                    } else {
                        build.rating = Math.floor((build.tests.passed / (build.tests.passed + build.tests.failed)) * 100) + '%';
                    }
                    build.startDate = moment(build.startDate).calendar();
                });
                $scope.builds = builds;
            }).finally(function () {
                timeout = $timeout(load, 1000 * 60);
            });
        })();
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.popover = function () {
            $('#builds .build > div').popover({
                'container': 'body',
                'html': true,
                'placement': 'left',
                'toggle': 'popover',
                'trigger': 'hover'
            });
        };
    }]);