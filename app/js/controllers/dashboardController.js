'use strict';

angular.module('JIRA.Teamboard')
    .controller('dashboardController', ['$scope', 'chartService', function ($scope, chartService) {
        $scope.$watch('teamboard.view', function() {
            if (angular.isDefined($scope.teamboard) && $scope.teamboard.view === 'dashboard') {
                chartService.sprintburn($scope.teamboard).then(function(chart) {
                    var lineChart= new google.visualization.LineChart($('#dashboard .sprint-burn')[0]);
                    lineChart.draw(chart.data, chart.options);
                });
                chartService.backlogburn($scope.teamboard).then(function(chart) {
                    var lineChart = new google.visualization.LineChart($('#dashboard .backlog-burn')[0]);
                    lineChart.draw(chart.data, chart.options);
                });
                chartService.taskburn($scope.teamboard).then(function(chart) {
                    var columnChart = new google.visualization.ColumnChart($('#dashboard .task-burn')[0]);
                    columnChart.draw(chart.data, chart.options);
                });
                chartService.taskflow($scope.teamboard).then(function(chart) {
                    var areaChart = new google.visualization.AreaChart($('#dashboard .task-flow')[0]);
                    areaChart.draw(chart.data, chart.options);
                });
                chartService.taskwork($scope.teamboard).then(function(chart) {
                    var pieChart = new google.visualization.PieChart($('#dashboard .task-work')[0]);
                    pieChart.draw(chart.data, chart.options);
                });
                $scope.teamboard.loaded = $scope.teamboard.view;
            }
        });
    }]);