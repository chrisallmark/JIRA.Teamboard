'use strict';

angular.module('JIRA.Teamboard')
    .controller('loaderController', ['$scope', '$sce', function ($scope, $sce) {
        var messages = [
            '<strong>Individuals & Interactions</strong><br/>over Processes & Tools',
            '<strong>Working Software</strong><br/>over Comprehensive Documentation',
            '<strong>Customer Collaboration</strong><br/>over Contract Negotiation',
            '<strong>Responding to Change</strong><br/>over Following a Plan',
            'Our highest priority is to <strong>satisfy the customer</strong> through<br/><strong>early and continuous delivery</strong> of valuable software.',
            'Welcome <strong>changing requirements</strong>, even late in  development.<br/>Agile processes harness change for the <strong>customer\'s competitive advantage</strong>.',
            'Deliver <strong>working software</strong> frequently, from a couple of weeks<br/>to a couple of months, with a preference to the <strong>shorter timescale</strong>.',
            'Business people and developers must<br/><strong>work together daily</strong> throughout the project.',
            'Build projects around <strong>motivated individuals</strong>. Give them the<br/><strong>environment and support</strong> they need, and <strong>trust</strong> them to get the job done.',
            'The most <strong>efficient and effective</strong> method of conveying information to<br/>and within a development team is <strong>face-to-face conversation</strong>.',
            '<strong>Working software</strong> is the<br/>primary measure of progress.',
            'Agile processes promote <strong>sustainable development</strong>.<br/>The sponsors, developers, and users should be<br/>able to <strong>maintain a constant pace</strong> indefinitely.',
            'Continuous attention to <strong>technical excellence</strong><br/>and <strong>good design</strong> enhances agility.',
            'Simplicity — the art of <strong>maximizing the<br/>amount of work not done</strong> — is essential.',
            'The best architectures, requirements, and designs<br/>emerge from <strong>self-organising teams</strong>.',
            'At regular intervals, the team reflects on how to become<br/><strong>more effective</strong>, then <strong>tunes and adjusts</strong> it\'s behaviour accordingly.'
        ];
        $scope.loader = {};
        $scope.$watch('teamboard.loaded', function() {
            $scope.loader.message = $sce.trustAsHtml(messages[Math.floor(Math.random() * messages.length)]);
        });
    }]);