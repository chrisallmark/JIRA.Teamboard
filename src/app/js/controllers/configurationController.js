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
    .controller('configurationController', ['$scope', '$routeParams', 'apiService', function ($scope, $routeParams, apiService) {
        $scope.add = function (builds) {
            if (!angular.isDefined($scope.configuration.builds)) {
                $scope.configuration.builds = [];
            }
            angular.forEach(builds, function(build) {
                if ($scope.configuration.builds.indexOf(build.name) === -1) {
                    $scope.configuration.builds.push(build.name);
                }
            });
            $scope.configuration.builds.sort();
        };
        $scope.configuration = {};
        $scope.form = {};
        $scope.ok = function () {
            apiService.configurations.save($scope.configuration);
            $scope.back();
        };
        $scope.remove = function (builds) {
            for (var i = builds.length; i >= 0; i--) {
                if ($scope.configuration.builds.indexOf(builds[i]) !== -1) {
                    $scope.configuration.builds.splice($scope.configuration.builds.indexOf(builds[i]), 1);
                }
            }
            $scope.configuration.build = null;
            if ($scope.configuration.builds.length === 0) {
                delete $scope.configuration['builds'];
            } else {
                $scope.configuration.builds.sort();
            }
        };
        $scope.$watch('form.backlog', function (newValue, oldValue) {
            if (newValue !== oldValue) {
                if (newValue) {
                    $scope.configuration.backlog = newValue.key;
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
        apiService.builds.query().$promise.then(function (builds) {
            if (builds.length > 0) {
                $scope.form.builds = builds;
            }
        });
        if ($routeParams.configurationName) {
            apiService.configurations.get({'configurationName': $routeParams.configurationName}).$promise.then(function (configuration) {
                $scope.configuration = configuration;
                apiService.backlogs.query().$promise.then(function (backlogs) {
                    angular.forEach(backlogs, function(project) {
                        if (project.key === $scope.configuration.backlog) {
                            $scope.form.backlog = project;
                        }
                    });
                    if (backlogs.length > 0) {
                        $scope.form.backlogs = backlogs;
                    }
                });
                apiService.boards.query().$promise.then(function (boards) {
                    angular.forEach(boards, function(board) {
                        if (board.id === $scope.configuration.board) {
                            $scope.form.board = board;
                        }
                    });
                    if (boards.length > 0) {
                        $scope.form.boards = boards;
                    }
                });
            });
        }
        else {
            apiService.backlogs.query().$promise.then(function (backlogs) {
                if (backlogs.length > 0) {
                    $scope.form.backlogs = backlogs;
                }
            });
            apiService.boards.query().$promise.then(function (boards) {
                if (boards.length > 0) {
                    $scope.form.boards = boards;
                }
            });
        }
    }]);
