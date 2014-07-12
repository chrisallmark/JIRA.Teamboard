'use strict';
angular.module('AgileTeamboard')
    .filter('stateFilter', [function () {
        return function (items, states) {
            if (!angular.isUndefined(items)) {
                if (!states.include) {
                    states.include = [];
                }
                if (!states.exclude) {
                    states.exclude = [];
                }
                var filteredItems = [];
                angular.forEach(items, function(item) {
                    if (item.state &&
                        ((states.include.length === 0 || states.include.indexOf(item.state) !== -1) &&
                            (states.exclude.length === 0 || states.exclude.indexOf(item.state) === -1))) {
                        filteredItems.push(item);
                    }
                });
                return filteredItems;
            }
        };
    }]);
