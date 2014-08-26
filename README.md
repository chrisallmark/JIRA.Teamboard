JIRA.Teamboard
==============

The JIRA Teamboard is an electronic information radiator that displays vital data about the progress of a development team. Traditional agile wallboards use index cards or sticky notes on a wall and the information can become stale very quickly however the JIRA Teamboard is continually updated in real-time ensuring that the team are always aware of the current state of play.

It's similar to a scoreboard at a sporting event - it's been designed to be highly visible and easy to understand for anyone walking and it can complement or entirely replace a traditional agile wallboard. To continue with the sports analogy it's also a useful tool for "post-match analysis" during team retrospectives to identify areas for improvement.

##Requirements

First, install [Node](http://nodejs.org/) and then the [Grunt](http://gruntjs.com/) command line interface tools with <code>$ npm install -g grunt-cli</code>. You'll also need to make sure you have [Ruby](https://www.ruby-lang.org/) so you can install [Sass](http://sass-lang.com/) with <code>$ gem install sass</code>. Now fetch the required package dependencies with <code>$ npm install</code> and run <code>$ grunt</code> to compile the CSS & JS files.

Finally you'll need to configure the server to point to your BAMBOO & JIRA servers by editing <code>server.json</code> before launching it with <code>$ node server.js</code>.

> NOTE: The server runs on port 1337 by default. Edit <code>server.js</code> to change this.

##Basic Client Usage
To load the JIRA Teamboard:
<pre>http://[host:port]</pre>
To add, edit, delete or view teamboards:
<pre>http://[host:port]/configurations</pre>
To configure a teamboard:
<pre>http://[host:port]/configuration/[teamboard]</pre>
To view a teamboard:
<pre>http://[host:port]/[teamboard]</pre>

##Extended Client Usage
By passing query parameters to the teamboard you can jump to specific boards when the application loads. Used in conjunction with a browser tab rotation plug-in (such as Revolver-Tabs for Chrome) you can customise the sequence and timing of the JIRA Teamboard to suit the needs of your environment and team.

To view a specific board:
<pre>http://[host:port]/[teamboard]?view=[chartboard|cycleboard|dashboard|releaseboard|taskboard]</pre>
To view a specific chartboard:
<pre>http://[host:port]/[teamboard]?view=chartboard&chart=[releaseburn|sprintburn|taskburn|taskflow|taskwork]</pre>

> NOTE: The chartboard displays any of the dashboard charts in full screen and is provided as an alternative to the consolidated dashboard view.

##HDTV Kiosk
The JIRA Teamboard is designed to be run in full screen on a HDTV at 1920x1080 resolution. The recommended browser is Google Chrome, but it should work in most CSS3/HTML5 compliant browsers.

To automatically launch the JIRA Teamboard in full screen mode at system start up use:

<pre>chrome --kiosk http://[host:port]/[teamboard]</pre>
