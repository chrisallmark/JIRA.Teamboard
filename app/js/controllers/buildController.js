'use strict';

angular.module('JIRA.Teamboard')
    .controller('buildController', ['$scope', '$timeout', 'apiService', function ($scope, $timeout, apiService) {
        function classification(status) {
            return angular.lowercase(status.replace(/[^a-z0-9]/gi, '-'));
        }
        var timeout;
        (function load() {
            apiService.results.query({'builds': $scope.teamboard.builds}).$promise.then(function (builds) {
                angular.forEach(builds, function(build) {
                    build.start = moment(build.start).calendar();
                    build.end = moment(build.end).calendar();
                    build.classification = classification(build.status);
                    if (build.tests) {
                        if (build.tests.failed || 0 + build.tests.passed || 0 === 0) {
                            build.rating = 'N/A';
                        } else {
                            build.rating = Math.floor((build.tests.passed / (build.tests.passed + build.tests.failed)) * 100) + '%';
                        }
                    } else {
                        build.rating = '???';
                    }
                });
                $('#builds .popover').remove();
                $scope.builds = builds;
            }).finally(function () {
                timeout = $timeout(load, 1000 * 30);
            });
        })();
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.popover = function () {
            $('#builds .build > div').popover({
                'container': '#builds',
                'html': true,
                'placement': 'left',
                'toggle': 'popover'
            }).on('click', function (e) {
                $('#builds .build > div').not(this).popover('hide');
            });
        };
    }]);