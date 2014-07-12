'use strict';

angular.module('AgileTeamboard')
    .controller('chartboardController', ['$scope', '$location', 'chartService', function ($scope, $location, chartService) {
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'chartboard') {
                $scope.chart = angular.lowercase($location.search().chart || 'sprintburn');
                switch($scope.chart) {
                    case 'sprintburn':
                        chartService.sprintburn($scope.teamboard).then(function(chart) {
                            var lineChart= new google.visualization.LineChart($('#chartboard .sprint-burn')[0]);
                            lineChart.draw(chart.data, chart.options);
                        });
                        break;
                    case 'projectburn':
                        chartService.releaseburn($scope.teamboard).then(function(chart) {
                            var lineChart = new google.visualization.LineChart($('#chartboard .project-burn')[0]);
                            lineChart.draw(chart.data, chart.options);
                        });
                        break;
                    case 'taskburn':
                        chartService.taskburn($scope.teamboard).then(function(chart) {
                            var columnChart = new google.visualization.ColumnChart($('#chartboard .task-burn')[0]);
                            columnChart.draw(chart.data, chart.options);
                        });
                        break;
                    case 'taskflow':
                        chartService.taskflow($scope.teamboard).then(function(chart) {
                            var areaChart = new google.visualization.AreaChart($('#chartboard .task-flow')[0]);
                            areaChart.draw(chart.data, chart.options);
                        });
                        break;
                    case 'taskwork':
                        chartService.taskwork($scope.teamboard).then(function(chart) {
                            var pieChart = new google.visualization.PieChart($('#chartboard .task-work')[0]);
                            pieChart.draw(chart.datachart, chart.options);
                        });
                        break;
                }
                $scope.teamboard.loaded = $scope.teamboard.view;
            }
        });
    }]);