JIRA.Teamboard
==============

The JIRA Teamboard is an electronic information radiator that displays vital data about the progress of a development team. Traditional agile wallboards use index cards or sticky notes on a wall and the information can become stale very quickly however the JIRA Teamboard is continually updated in real-time ensuring that the team are always aware of the current state of play.

It's similar to a scoreboard at a sporting event - it's been designed to be highly visible and easy to understand for anyone walking and it can complement or entirely replace a traditional agile wallboard. To continue with the sports analogy it's also a useful tool for "post-match analysis" during team retrospectives to identify areas for improvement.

##Basic Usage
To load the JIRA Teamboard:
<pre>
http://[host:port]
</pre>
To add, edit, delete or view teamboards:
<pre>
http://[host:port]/configurations
</pre>
To configure a teamboard:
<pre>
http://[host:port]/configuration/[teamboard]
</pre>
To view a teamboard:
<pre>
http://[host:port]/[teamboard]
</pre>

##Extended Usage
By passing query parameters to the teamboard you can jump to specific boards when the application loads. Used in conjunction with a browser tab rotation plug-in (such as Revolver-Tabs for Chrome) you can customise the sequence and timing of the JIRA Teamboard to suit the needs of your environment and team.

To view a specific board:
<pre>
http://[host:port]/[teamboard]?view=[chartboard|cycleboard|dashboard|releaseboard|taskboard]
</pre>
To view a specific chartboard:
<pre>
http://[host:port]/[teamboard]?view=chartboard&chart=[releaseburn|sprintburn|taskburn|taskflow|taskwork]
</pre>

> The chartboard displays any of the dashboard charts in full screen and is provided as an alternative to the consolidated dashboard view.

The JIRA Teamboard was designed to be run in full screen on a HDTV at 1920x1080 resolution. The recommended browser is Google Chrome, but it should work in most CSS3/HTML5 compliant browsers.

To automatically launch the JIRA Teamboard in full screen mode at system start up use:

<pre>
chrome --kiosk http://[host:port]/[teamboard]
</pre>

##Categorisation
The JIRA Teamboard uses labels for categorisation of stories and tasks by their type.

The labels are used for the category breakdown in the Task Work chart and to display colour coding for story and task cards when the following labels are used:

* BE
* FE
* QA

> Colour coding is also applied depending on the type or sub-type of the task or issues which are flagged.

##Sprint Timer
The sprint timer displays the time left until the end of the sprint. This is split into two parts - the number of working days and a real-time countdown of the days, hours, minutes & seconds that remain.

##Build Monitor
The build monitor can be configured to monitor the key builds for your team and provides a visual call-to-action when code breaks. You can monitor as many builds as you like but only the most recent builds will be displayed. As new builds are triggered they will appear at the top of the build list.

> Build are colour coded and given an icon to indicate their current state. Place your mouse cursor over the build to see who triggered it.

##Dashboard

###Sprint Burn
This chart provides a real-time view of progress and trend against towards sprint completion. It allows teams to see if they are on track to meet their commitments and adjust their delivery plan as necessary.

###Backlog Burn
This chart provides a real-time view of progress and trend against the project backlog. It allows teams to see if they are on track to meet their commitments and adjust their delivery plan as necessary.

> This chart displays project progress for the last 60 days.

###Team Burn
This chart shows a breakdown of completed tasks by person by day and provide a useful view on individual productivity or behavioural smells such as large numbers of tasks completing at the same time. It can also be useful during stand-up when someone says "I can't remember what I did yesterday..."

> Place your mouse cursor over the chart to see a detailed task breakdown.

###Task Flow

This chart enables teams to monitor the flow of work during the sprint and also see any increases in scope. Ideally a team's work in progress should be reasonably steady (the height of the yellow area) throughout the sprint. Any obvious deviations from the norm are often good discussion points during retrospectives.

###Task Work
This chart provides a breakdown of the sprint work remaining by category. The categorisation of stories and tasks in described in the categorisation section.

##Taskboard
The taskboard displays a standard wallboard view with stories on the left-hand side and tasks ordered by state (either Not Started, In Progress or Done) on the right. If a WIP (Work In Progress) limit has been configured and exceeded then the In Progress column will be highlighted in red.

###Story Cards
Stories display the story title, the current state and the number of story points.

> When stories are Done they jump to the bottom of the taskboard.

###Task Cards
Tasks display the task title and the remaining effort, together with an avatar of the owner of the task. If a user doesn't have an avatar on the server then a default image is served.

##Cycleboard

The cycleboard displays a Gantt-style view of the stories and tasks in the current sprint which are either "In Progress or "Done".

###Story Cards

Stories display the current state of the story and the number of story points.

> Place your mouse cursor over the story to see the cycle time for that story.

###Task Cards

Tasks display the owner, the remaining effort and the current state.

> Place your mouse cursor over the task to see the description for that task.

###Releaseboard

The releaseboard displays a projected release schedule based upon your team's velocity against an estimated backlog of stories. Futures sprints are calculated based upon the dates and duration of the current sprint and. The sprint will be highlighted in green if it's under allocated or blue if it's over allocated - this is a trigger to either change the order the stories or to split them if they are too large.

> If you don't specify a velocity for your team then the Releaseboard is hidden.

###Slideshow
Activating the slideshow will automatically rotate through the views every two-and-a-half minutes. Views that have more content than can fit on a single screen will automatically pan during the slideshow to display all information. You can also configure the teamboard to enter slideshow mode by default.

###Configuration
* Name - the unique identifier for this teamboard configuration
* Project - the project where the backlog is held
* Board - the name of the board which holds the sprint
* Sprint - the name of the sprint to monitor
* Velocity - the estimated velocity of the team
* WIP - the number of concurrent tasks that team should have in progress
* Slideshow - start the slideshow automatically when the application loads

>You can duplicate a configuration by editing it and changing the name.
