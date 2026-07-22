# Badminton Tournament Management Application - User Manual

## 1. Overview

This application manages a doubles badminton tournament from setup to live scoring and final results.

Main features:

- Tournament setup
- Team registration
- Tournament match creation
- Active-round prematch selection
- Live scoreboard and scoring
- Device role and mode management
- Projector display
- Match history
- Tournament results

The scoring system follows standard best-of-3 badminton rules:

- Best of 3 games
- Each game is first to 21 points
- A team must win by 2 points after 20-20
- Maximum game score is 30
- At 30, the game ends even without a 2-point lead
- The match ends when one team wins 2 games

## 2. Login

Open the application in a browser and sign in with your registered email and password.

If login fails, check:

- Email and password are correct
- Internet connection is available
- Firebase/auth service is reachable

After login, the device is registered automatically and shown in the app with a mode and role.

## 3. Main Menu

After login, the main menu shows these options:

- Tournament Setup
- Team Registration
- Create Match
- Start Scoreboard
- Admin Panel
- Projector Display
- Match Results
- Match History

The bottom of the menu also shows the current device mode and role.

## 4. Recommended Tournament Workflow

Use the application in this order:

1. Open Tournament Setup and save tournament details.
2. Open Team Registration and register all teams.
3. Open Create Match and create first-round matches.
4. Open Start Scoreboard to select and score the active match.
5. After each match, create or verify next-round matches as winners become available.
6. Use Match Results to view completed results.
7. Use Projector Display on a display device if needed.

## 5. Tournament Setup

Use Tournament Setup to configure the current tournament.

Fields:

- Tournament Name
- Edition
- Venue
- Date
- Number of Teams

Supported team counts:

- 4 Teams: starts from SF
- 8 Teams: starts from QF
- 16 Teams: starts from PREQF
- 32 Teams: starts from SUPER32

The app automatically calculates the first round based on team count.

Click Save Tournament to store the configuration.

## 6. Team Registration

Use Team Registration to add, edit, and delete teams.

To add a team:

1. Enter Team Name, or leave it blank to auto-generate one.
2. Enter Player 1.
3. Enter Player 2.
4. Select Age Group.
5. Enter Address if needed.
6. Click Save Team.

If Team Name is blank, the app creates a name like:

`Team Player1 & Player2`

Duplicate teams are blocked even if player order is reversed.

To edit a team:

1. Click Edit on the team card.
2. Update details.
3. Click Update Team.

To delete a team:

1. Click Delete.
2. Confirm the delete prompt.

Avoid deleting teams after matches have already been created or scored.

## 7. Create Match

Use Create Match to generate tournament matches round by round.

Fields:

- Round
- Match label
- Team A
- Team B

The available rounds depend on the tournament setup. For example:

- 8-team tournament: QF, SF, F
- 4-team tournament: SF, F

Rules enforced by the app:

- Same team cannot play against itself.
- A team cannot be used twice in the same round.
- Duplicate match labels in the same round are blocked.
- Matches with recorded results cannot be deleted.
- Future-round team options are based on previous-round winners where available.

Created matches are grouped by round. Click a round header to expand or collapse it.

## 8. Scoreboard Screen

The Scoreboard screen is used to select the next active match and record points.

The screen has three main areas:

- Left team card
- Prematch setup and score table
- Right team card

The information strip below shows:

- Current game number
- Serving team
- Match duration
- Scoring tip

## 9. Prematch Setup

Before a match starts:

1. Select the match from Select Match.
2. Select the first serving team.
3. Use Swap Teams if left/right team placement should be reversed.
4. Use each team card's Swap button if player court positions need to be swapped.
5. Click Start Match.

The match dropdown only shows selectable active-round matches.

Important behavior:

- Completed matches are hidden.
- Future-round matches are hidden until earlier rounds are completed.
- Matches without both teams assigned are not selectable.
- If the tournament is complete, the app shows a completed message instead of stale match options.

## 10. Live Scoring

After clicking Start Match, the match becomes live.

Use the +1 buttons on the left or right team card to award a point to that side.

The app automatically manages:

- Current score
- Serving team
- Serving player highlight
- Game completion
- Match completion
- Best-of-3 game progression
- Third-game court-change prompt at 11 points
- Match duration
- Score history
- Firestore sync for live/projector display

Use Undo to remove the last point if a mistake is made.

Use Score to announce the current score on the primary scoring device.

Use Manual Sync if the device needs to refresh or push the live state manually.

## 11. Pause and Resume

When a match is live, the scoreboard can show Pause.

Use Pause when scoring should temporarily stop.

When paused, use Resume to continue scoring.

Scoring is blocked unless the match is live and the device is allowed to score.

## 12. Match Completion

When one team wins two games:

- The match is marked finished.
- The result is saved.
- The completed match is excluded from future prematch dropdowns.
- The next active tournament round becomes available when all required previous-round matches are complete.

After the match is finished, use New Match to return to prematch setup.

## 13. Device Modes

Device modes control what each device can do.

Primary:

- Main scoring device
- Pushes live match state
- Can announce scores
- Can be used by the referee/scorer

Active:

- Secondary active scoring device
- Can participate in scoring where allowed

Standby:

- Not actively scoring

Projector:

- Used for display-only scoreboard view

At most two devices can be active/primary at the same time.

## 14. Admin Panel

Use Admin Panel to manage connected devices.

Admin Panel shows:

- Device name or nickname
- System name
- Online/offline status
- Role
- Mode

Available actions:

- Edit device nickname
- Set role: Admin, Referee, Helper
- Set mode: Primary, Active, Standby, Projector

Device status is based on heartbeat updates. A device may show offline if it has not sent a heartbeat recently.

## 15. Projector Display

Use Projector Display on a screen shown to players or audience.

The projector view:

- Displays the live match scoreboard
- Updates from the live match state
- Is read-only
- Does not allow scoring

If no match is available, it shows:

`Waiting for match...`

## 16. Match Results

Use Match Results to view completed tournament results.

The results screen shows:

- Round
- Match
- Team 1
- Team 2
- Set scores
- Winner

Results are displayed with the most recently completed match first where timestamp data is available.

Older results without timestamps remain visible after timestamped results.

## 17. Match History

Use Match History to review rally-by-rally scoring history for the live or most recent match state.

The history view shows:

- Rally number
- Score
- Server
- Receiver
- Rally winner
- Mini court view

Use set filters to view all sets or a specific set.

On the scoreboard screen, a History button may also appear when history is available.

## 18. Refresh and Recovery

The scoreboard attempts to restore the current live match after browser refresh.

If a live match exists, the app restores it.

If no active match exists or the saved match is finished, the app returns to prematch setup.

## 19. Common Troubleshooting

### Match does not appear in prematch dropdown

Check:

- The match has both teams assigned.
- The match is not already completed.
- Earlier matches in the same or previous round are complete as required.
- The match belongs to the current active round.

### Future round is not selectable

This is expected until the earliest incomplete round is finished.

For example, SF matches remain hidden while any QF match is still incomplete.

### Scoring buttons are disabled

Check:

- Match has been started.
- Match status is live.
- Device mode is Primary or Active.
- Match is not finished.

### Projector is not updating

Check:

- A live match exists.
- The scoring device is Primary or Active.
- The scoring device has internet connection.
- The projector browser is online.

### Team cannot be selected in Create Match

Check:

- The team is not already used in the selected round.
- The selected round is allowed for the tournament.
- For later rounds, previous-round winners are available.

### Cannot delete a match

Matches with recorded results cannot be deleted.

### Device appears offline

Open the app on that device and make sure it has internet access. Heartbeat updates are sent while active/live.

## 20. Best Practices

- Register all teams before creating matches.
- Create first-round matches before opening the scoreboard.
- Use one Primary scoring device during a match.
- Use Projector Display only on display screens.
- Avoid editing or deleting teams after matches are scored.
- Confirm the selected match and serving team before pressing Start Match.
- Use Undo immediately after a wrong point.
- Use Match Results after each match to verify the saved winner and scores.

