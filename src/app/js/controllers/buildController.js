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
    .controller('buildController', ['$scope', '$timeout', 'apiService', function ($scope, $timeout, apiService) {
        function classification(status) {
            return angular.lowercase('bamboo-status-' + status.replace(/[^a-z0-9]/gi, '-'));
        }
        var timeout;
        (function load() {
            apiService.results.query({'builds': $scope.teamboard.builds}).$promise.then(function (builds) {
                angular.forEach(builds, function(build) {
                    build.start = moment.utc(build.start).add(moment().utcOffset() * -1, 'minutes');
                    build.end = moment.utc(build.end).add(moment().utcOffset() * -1, 'minutes');
                    build.classification = classification(build.status);
                    build.duration = build.end.diff(build.start, 'seconds') + 's';
                    if (build.tests) {
                        if ((build.tests.failed || 0) + (build.tests.passed || 0) === 0) {
                            build.rating = 'N/A';
                        } else {
                            build.rating = Math.floor((build.tests.passed / (build.tests.passed + build.tests.failed)) * 100) + '%';
                        }
                    } else {
                        build.rating = '???';
                    }
                });
                $('#builds').find('.popover').remove();
                $scope.builds = builds;
            }).finally(function () {
                var now = moment();
                if (now.isAfter(moment(8, 'HH')) && now.isBefore(moment(18, 'HH')) && now.isoWeekday() !== 6 && now.isoWeekday() !== 7) {
                    timeout = $timeout(load, 1000 * 30);
                } else {
                    timeout = $timeout(load, moment().add(now.isBefore(moment(8, 'HH')) ? 0 : 1, 'day').hour(8).startOf('hour').diff(now));
                }
            });
        })();
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.popover = function () {
            $('#builds').find(' .build > div').popover({
                'container': '#builds',
                'html': true,
                'placement': 'left',
                'toggle': 'popover'
            }).on('click', function (event) {
                $('#builds').find(' .build > div').not(this).popover('hide');
            });
        };
    }]);