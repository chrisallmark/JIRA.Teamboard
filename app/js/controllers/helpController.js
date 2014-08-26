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
