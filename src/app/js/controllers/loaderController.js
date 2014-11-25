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
    .controller('loaderController', ['$scope', '$sce', '$timeout', function ($scope, $sce, $timeout) {
        var timeout;
        var messages = [
            // agile manifesto (http://agilemanifesto.org/)
            //'We value <strong>Individuals & Interactions</strong><br/>over Processes & Tools',
            //'We value <strong>Working Software</strong><br/>over Comprehensive Documentation',
            //'We value <strong>Customer Collaboration</strong><br/>over Contract Negotiation',
            //'We value <strong>Responding to Change</strong><br/>over Following a Plan',
            // agile principles (http://agilemanifesto.org/principles.html)
            //'Our highest priority is to <strong>satisfy the customer</strong> through<br/><strong>early and continuous delivery</strong> of valuable software.',
            //'Welcome <strong>changing requirements</strong>, even late in  development.<br/>Agile processes harness change for the <strong>customer\'s competitive advantage</strong>.',
            //'Deliver <strong>working software</strong> frequently, from a couple of weeks<br/>to a couple of months, with a preference to the <strong>shorter timescale</strong>.',
            //'Business people and developers must<br/><strong>work together daily</strong> throughout the project.',
            //'Build projects around <strong>motivated individuals</strong>. Give them the<br/><strong>environment and support</strong> they need, and <strong>trust them</strong> to get the job done.',
            //'The most <strong>efficient and effective</strong> method of conveying information to<br/>and within a development team is <strong>face-to-face conversation</strong>.',
            //'<strong>Working software</strong> is the<br/>primary measure of progress.',
            //'Agile processes promote <strong>sustainable development</strong>. The sponsors, developers,<br/>and users should be able to <strong>maintain a constant pace</strong> indefinitely.',
            //'Continuous attention to <strong>technical excellence</strong><br/>and <strong>good design</strong> enhances agility.',
            //'Simplicity — the art of <strong>maximizing the<br/>amount of work not done</strong> — is essential.',
            //'The best architectures, requirements, and designs<br/>emerge from <strong>self-organising teams</strong>.',
            //'At regular intervals, the team reflects on how to become<br/><strong>more effective</strong>, then <strong>tunes and adjusts</strong> it\'s behaviour accordingly.',
            // the cult of done manifesto (http://www.brepettis.com/blog/2009/3/3/the-cult-of-done-manifesto.html)
            'There are three states of being.<br/><strong>Not knowing</strong>, <strong>action</strong> &amp; <strong>completion</strong>.',
            'Accept that <strong>everything is a draft</strong>.<br/>It helps to get it done.',
            'There is no <strong>editing</strong> stage.',
            '<strong>Pretending</strong> you know what you\'re doing is almost<br/>the same as <strong>knowing</strong> what you are doing, so just<br/>accept that you know what you\'re doing and <strong>do it</strong>.',
            'Banish <strong>procrastination.</strong> If you wait more than<br/>a week to get an idea done, <strong>abandon it</strong>.',
            'The point of being done is <strong>not to finish</strong><br/>but to get <strong>other things</strong> done.',
            'Once you\'re <strong>done</strong><br/>you can <strong>throw it away</strong>.',
            'Laugh at <strong>perfection</strong>. It\'s <strong>boring</strong><br/>and keeps you from being done.',
            'People without dirty hands are <strong>wrong</strong>.<br/>Doing something makes you <strong>right</strong>.',
            '<strong>Failure</strong> counts as <strong>done</strong>.<br/>So do mistakes.',
            '<strong>Destruction</strong> is a variant of <strong>done</strong>.',
            'If you have an idea and publish it on the<br/>internet, that counts as a <strong>ghost of done</strong>.',
            '<strong>Done</strong> is the engine of <strong>more</strong>.'
        ];
        $scope.loader = {};
        $scope.loader.done = true;
        $scope.$on('$destroy', function (event) {
            if (angular.isDefined(timeout)) {
                $timeout.cancel(timeout);
            }
        });
        $scope.$watch('teamboard.loaded', function(newValue, oldValue) {
            if (newValue !== oldValue) {
                var message = Math.floor(Math.random() * messages.length);
                $scope.loader.done = false;
                $scope.loader.image = '/img/cod' + ('00' + message).substr(-2) + '.png';
                $scope.loader.message = $sce.trustAsHtml(messages[message]);
                timeout = $timeout(function() {
                    $scope.loader.done = true;
                }, 1000 * 5);
            }
        });
    }]);