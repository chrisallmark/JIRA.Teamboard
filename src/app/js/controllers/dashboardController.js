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
    .controller('dashboardController', ['$scope', 'chartService', function ($scope, chartService) {
        $scope.$watch('teamboard.view', function(newValue, oldValue) {
            if (angular.isDefined($scope.teamboard)) {
                if (newValue === 'dashboard') {
                    chartService.sprintburn($scope.teamboard).then(function(chart) {
                        var lineChart= new google.visualization.LineChart($('#dashboard').find('.sprint-burn')[0]);
                        lineChart.draw(chart.data, chart.options);
                    });
                    chartService.backlogburn($scope.teamboard).then(function(chart) {
                        var lineChart = new google.visualization.LineChart($('#dashboard').find('.backlog-burn')[0]);
                        lineChart.draw(chart.data, chart.options);
                    });
                    chartService.taskburn($scope.teamboard).then(function(chart) {
                        var columnChart = new google.visualization.ColumnChart($('#dashboard ').find('.task-burn')[0]);
                        columnChart.draw(chart.data, chart.options);
                    });
                    chartService.taskflow($scope.teamboard).then(function(chart) {
                        var areaChart = new google.visualization.AreaChart($('#dashboard').find('.task-flow')[0]);
                        areaChart.draw(chart.data, chart.options);
                    });
                    chartService.taskwork($scope.teamboard).then(function(chart) {
                        var pieChart = new google.visualization.PieChart($('#dashboard').find('.task-work')[0]);
                        pieChart.draw(chart.data, chart.options);
                    });
                    $scope.teamboard.loaded = oldValue === 'reload' ? oldValue : newValue;
                } else if ($scope.teamboard.loaded === 'dashboard' && newValue === 'reload') {
                    $scope.teamboard.view = $scope.teamboard.loaded;
                }
            }
        });
    }]);