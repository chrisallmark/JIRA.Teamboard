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
    .controller('chartboardController', ['$scope', '$location', 'chartService', function ($scope, $location, chartService) {
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard)) {
                if ($scope.teamboard.view === 'chartboard') {
                    $scope.chart = angular.lowercase($location.search().chart || 'sprintburn');
                    switch($scope.chart) {
                        case 'sprintburn':
                            chartService.sprintburn($scope.teamboard).then(function(chart) {
                                var lineChart= new google.visualization.LineChart($('#chartboard').find('.sprint-burn')[0]);
                                lineChart.draw(chart.data, chart.options);
                            });
                            break;
                        case 'backlogburn':
                            chartService.releaseburn($scope.teamboard).then(function(chart) {
                                var lineChart = new google.visualization.LineChart($('#chartboard').find('.backlog-burn')[0]);
                                lineChart.draw(chart.data, chart.options);
                            });
                            break;
                        case 'taskburn':
                            chartService.taskburn($scope.teamboard).then(function(chart) {
                                var columnChart = new google.visualization.ColumnChart($('#chartboard').find('.task-burn')[0]);
                                columnChart.draw(chart.data, chart.options);
                            });
                            break;
                        case 'taskflow':
                            chartService.taskflow($scope.teamboard).then(function(chart) {
                                var areaChart = new google.visualization.AreaChart($('#chartboard').find('.task-flow')[0]);
                                areaChart.draw(chart.data, chart.options);
                            });
                            break;
                        case 'taskwork':
                            chartService.taskwork($scope.teamboard).then(function(chart) {
                                var pieChart = new google.visualization.PieChart($('#chartboard').find('.task-work')[0]);
                                pieChart.draw(chart.datachart, chart.options);
                            });
                            break;
                    }
                    $scope.teamboard.loaded = $scope.teamboard.view;
                } else if ($scope.teamboard.loaded === 'chartboard' && $scope.teamboard.view === 'reload') {
                    $scope.teamboard.view = $scope.teamboard.loaded;
                }
            }
        });
    }]);