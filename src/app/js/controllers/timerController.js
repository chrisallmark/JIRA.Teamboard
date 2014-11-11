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
    .controller('timerController', ['$scope', '$interval', '$timeout', 'apiService', function ($scope, $interval, $timeout, apiService) {
        var interval, timeout;
        apiService.timer.get({
            board: $scope.teamboard.board,
            sprint: $scope.teamboard.sprint
        }).$promise.then(function (timer) {
            timer.start = moment.utc(timer.start);
            timer.end = moment.utc(timer.end);
            if (angular.isDefined(interval)) {
                $interval.cancel(interval);
            }
            interval = $interval(function () {
                if (timer.end.isBefore(moment.utc())) {
                    timer.countdown = '00:00:00:00';
                } else {
                    var now = moment.utc().add(moment().zone() * -1, 'minutes');
                    var days = ('00' + timer.end.diff(now, 'days')).substr(-2);
                    var hours = ('00' + timer.end.diff(now, 'hours') % 24).substr(-2);
                    var minutes = ('00' + timer.end.diff(now, 'minutes') % 60).substr(-2);
                    var seconds = ('00' + timer.end.diff(now, 'seconds') % 60).substr(-2);
                    timer.countdown = days + ':' + hours + ':' + minutes + ':' + seconds;
                }
            }, 1000);
            $scope.timer = timer;
        });
        timeout = $timeout($route.reload, moment().add(1, 'day').startOf('day').diff(moment()));
/*
        (function load() {
            timeout = $timeout(function() {
                var now = moment();
                if ($scope.timer.remainingDays > 0  && now.isoWeekday() !== 7 && now.isoWeekday() !== 0) {
                    $scope.timer.remainingDays--;
                }
                load();
            }, moment().add(1, 'day').startOf('day').diff(moment()));
        })();
*/
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(interval)) {
                $interval.cancel(interval);
            }
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
    }]);