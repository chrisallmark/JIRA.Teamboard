'use strict';

angular.module('AgileTeamboard')
    .controller('timerController', ['$scope', '$interval', '$route', '$timeout', 'apiService', function ($scope, $interval, $route, $timeout, apiService) {
        var interval, timeout;
        (function load() {
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
                        var now = moment.utc().add('minutes', moment().zone() * -1);
                        var days = ('00' + timer.end.diff(now, 'days')).substr(-2);
                        var hours = ('00' + timer.end.diff(now, 'hours') % 24).substr(-2);
                        var minutes = ('00' + timer.end.diff(now, 'minutes') % 60).substr(-2);
                        var seconds = ('00' + timer.end.diff(now, 'seconds') % 60).substr(-2);
                        timer.countdown = days + ':' + hours + ':' + minutes + ':' + seconds;
                    }
                }, 1000);
                $scope.timer = timer;
            });
            var now = moment(),
                today = moment().endOf('day');
            timeout = $timeout($route.reload, today.diff(now));
        })();
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(interval)) {
                $interval.cancel(interval);
            }
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
    }]);