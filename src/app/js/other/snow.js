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
(function($){
	$.fn.snow = function(flurry) {
		var colours = ['#ffffff', '#dddddd', '#bbbbbb', '#999999', '#666666'],
			flakes = ['&#10052;', '&#10053;', '&#10053;'],
			melt = function() {
				var drift = Math.floor(Math.random() * 500) - 250,
					left = Math.floor(Math.random() * window.innerWidth),
					size = Math.floor(Math.random() * 5);
				$(this)
					.css({
						'color': colours[size],
						'transform': 'rotate(' + Math.floor(Math.random() * 360) + 'deg)',
						'font-size': 5 + ((5 - size) * 5),
						'left': left,
						'opacity': 1,
						'top': 0
					})
					.animate({
						'left': left + drift,
						'opacity': 0.2,
						'top': window.innerHeight
					},
					(size * 5000) + Math.floor(Math.random() * (size * 1000)),
					'linear',
					melt);
			};
		for (var i = 0; i < flurry; i++) {
			var drift = Math.floor(Math.random() * 500) - 250,
				left = Math.floor(Math.random() * window.innerWidth),
				size = Math.floor(Math.random() * 5),
				top = Math.floor(Math.random() * window.innerHeight);
			$('<div/>')
				.appendTo('body')
				.css({
					'color': colours[size],
					'transform': 'rotate(' + Math.floor(Math.random() * 360) + 'deg)',
					'font-size': 5 + ((5 - size) * 5),
					'left': left,
					'position': 'absolute',
					'top': top
				})
				.html(flakes[Math.floor(Math.random() * 3)])
				.animate({
					'left': left + drift,
					'opacity': 0,
					'top': window.innerHeight
				},
				(size * 5000) + Math.floor(Math.random() * (size * 1000)),
				'linear',
				melt);
		}
	};
})(jQuery);