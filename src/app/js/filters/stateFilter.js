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
