angular.module('JIRA.Teamboard')
    .controller('loaderController', ['$scope', '$sce', function ($scope, $sce) {
        var messages = [
            // agile manifesto (http://agilemanifesto.org/)
            'We value <strong>Individuals & Interactions</strong><br/>over Processes & Tools',
            'We value <strong>Working Software</strong><br/>over Comprehensive Documentation',
            'We value <strong>Customer Collaboration</strong><br/>over Contract Negotiation',
            'We value <strong>Responding to Change</strong><br/>over Following a Plan',
            // agile principles (http://agilemanifesto.org/principles.html)
            'Our highest priority is to <strong>satisfy the customer</strong> through<br/><strong>early and continuous delivery</strong> of valuable software.',
            'Welcome <strong>changing requirements</strong>, even late in  development.<br/>Agile processes harness change for the <strong>customer\'s competitive advantage</strong>.',
            'Deliver <strong>working software</strong> frequently, from a couple of weeks<br/>to a couple of months, with a preference to the <strong>shorter timescale</strong>.',
            'Business people and developers must<br/><strong>work together daily</strong> throughout the project.',
            'Build projects around <strong>motivated individuals</strong>. Give them the<br/><strong>environment and support</strong> they need, and <strong>trust them</strong> to get the job done.',
            'The most <strong>efficient and effective</strong> method of conveying information to<br/>and within a development team is <strong>face-to-face conversation</strong>.',
            '<strong>Working software</strong> is the<br/>primary measure of progress.',
            'Agile processes promote <strong>sustainable development</strong>. The sponsors, developers,<br/>and users should be able to <strong>maintain a constant pace</strong> indefinitely.',
            'Continuous attention to <strong>technical excellence</strong><br/>and <strong>good design</strong> enhances agility.',
            'Simplicity — the art of <strong>maximizing the<br/>amount of work not done</strong> — is essential.',
            'The best architectures, requirements, and designs<br/>emerge from <strong>self-organising teams</strong>.',
            'At regular intervals, the team reflects on how to become<br/><strong>more effective</strong>, then <strong>tunes and adjusts</strong> it\'s behaviour accordingly.',
            // the cult of done manifesto (http://www.brepettis.com/blog/2009/3/3/the-cult-of-done-manifesto.html)
            'There are three states of being.<br/><strong>Not knowing</strong>, <strong>action</strong> and <strong>completion</strong>.',
            'Accept that <strong>everything is a draft</strong>.<br/>It helps to get it done.',
            'There is no <strong>editing</strong> stage.',
            'Pretending you know what you\'re doing is almost the same as knowing what you are<br/>doing, so just accept that <strong>you know what you\'re doing</strong> even if you don\'t and <strong>do it</strong>.',
            'Banish <strong>procrastination.</strong> If you wait more<br/>than a week to get an idea done, <strong>abandon it</strong>.',
            'The point of being done is <strong>not to finish</strong><br/>but to get <strong>other things</strong> done.',
            'Once you\'re <strong>done</strong> you can <strong>throw it away</strong>.',
            'Laugh at <strong>perfection</strong>. It\'s <strong>boring</strong><br/>and keeps you from being done.',
            'People without dirty hands are <strong>wrong</strong>.<br/>Doing something makes you <strong>right</strong>.',
            '<strong>Failure</strong> counts as <strong>done</strong>.<br/>So do mistakes.',
            '<strong>Destruction</strong> is a variant of <strong>done</strong>.',
            'If you have an idea and publish it on the<br/>internet, that counts as a <strong>ghost of done</strong>.',
            '<strong>Done</strong> is the engine of <strong>more</strong>.'
        ];
        $scope.loader = {};
        $scope.$watch('teamboard.loaded', function() {
            $scope.loader.message = $sce.trustAsHtml(messages[Math.floor(Math.random() * messages.length)]);
        });
    }]);