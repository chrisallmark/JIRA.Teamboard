'use strict';

angular.module('JIRA.Teamboard')
    .controller('configurationController', ['$scope', '$routeParams', 'apiService', function ($scope, $routeParams, apiService) {
        $scope.add = function (plans) {
            if (!angular.isDefined($scope.configuration.plans)) {
                $scope.configuration.plans = [];
            }
            angular.forEach(plans, function(plan) {
                if ($scope.configuration.plans.indexOf(plan.name) === -1) {
                    $scope.configuration.plans.push(plan.name);
                }
            });
            $scope.configuration.plans.sort();
        };
        $scope.configuration = {};
        $scope.form = {};
        $scope.ok = function () {
            apiService.configurations.save($scope.configuration);
            $scope.back();
        };
        $scope.remove = function (plans) {
            for (var i = plans.length; i >= 0; i--) {
                if ($scope.configuration.plans.indexOf(plans[i]) !== -1) {
                    $scope.configuration.plans.splice($scope.configuration.plans.indexOf(plans[i]), 1);
                }
            }
/*
            angular.forEach(plans, function(plan) {
                if ($scope.configuration.plans.indexOf(plan) !== -1) {
                    $scope.configuration.plans.splice($scope.configuration.plans.indexOf(plan), 1);
                }
            });
*/
            $scope.configuration.plan = null;
            if ($scope.configuration.plans.length === 0) {
                delete $scope.configuration['plans'];
            } else {
                $scope.configuration.plans.sort();
            }
        };
        $scope.$watch('form.project', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (newValue) {
                    $scope.configuration.project = newValue.key;
                } else {
                    delete $scope.configuration.board;
                }
            }
        });
        $scope.$watch('form.board', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (newValue) {
                    apiService.sprints.query({'board': newValue.id }).$promise.then(function (sprints) {
                        angular.forEach(sprints, function(sprint) {
                            if (sprint.id === $scope.configuration.sprint) {
                                $scope.form.sprint = sprint;
                            }
                        });
                        $scope.form.sprints = sprints;
                    });
                    $scope.configuration.board = newValue.id;
                } else {
                    $scope.form.sprint = undefined;
                    delete $scope.configuration.board;
                }
            }
        });
        $scope.$watch('form.sprint', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (newValue) {
                    $scope.configuration.sprint = newValue.id;
                } else {
                    delete $scope.configuration.sprint;
                }
            }
        });
        apiService.plans.query().$promise.then(function (plans) {
            $scope.form.plans = plans;
        });
        if ($routeParams.configurationName) {
            apiService.configurations.get({'configurationName': $routeParams.configurationName}).$promise.then(function (configuration) {
                $scope.configuration = configuration;
                apiService.projects.query().$promise.then(function (projects) {
                    angular.forEach(projects, function(project) {
                        if (project.key === $scope.configuration.project) {
                            $scope.form.project = project;
                        }
                    });
                    $scope.form.projects = projects;
                });
                apiService.boards.query().$promise.then(function (boards) {
                    angular.forEach(boards, function(board) {
                        if (board.id === $scope.configuration.board) {
                            $scope.form.board = board;
                        }
                    });
                    $scope.form.boards = boards;
                });
            });
        }
        else {
            apiService.projects.query().$promise.then(function (projects) {
                $scope.form.projects = projects;
            });
            apiService.boards.query().$promise.then(function (boards) {
                $scope.form.boards = boards;
            });
        }
    }]);
