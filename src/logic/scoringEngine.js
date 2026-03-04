export function createScoringEngine() {
  const RULES = {
    TARGET: 21,
    WIN_BY: 2,
    MAX: 30,
    MAX_GAMES: 3,
  }

  function initialState() {
    return {
      // 🔢 Logical team scores
      score: {
        teamA: 0,
        teamB: 0,
      },

      // 👥 Players by logical team
      players: {
        teamA: [
          { name: 'Player A1', court: 'RIGHT' },
          { name: 'Player A2', court: 'LEFT' },
        ],
        teamB: [
          { name: 'Player B1', court: 'RIGHT' },
          { name: 'Player B2', court: 'LEFT' },
        ],
      },

      // 🏟️ Which team is on which side
      courtSides: {
        left: 'teamA',
        right: 'teamB',
      },

      // 🎯 Server is ALWAYS a logical team
      server: {
        team: 'teamA',
        playerIndex: 0,
      },

      gameNumber: 1,

      // 🏆 Sets won (logical)
      gamesWon: {
        teamA: 0,
        teamB: 0,
      },

      setResults: [],       // [{ teamA: 21, teamB: 18 }]
      lastSetResult: null,  // { winner: 'teamA', teamA, teamB, setNumber }

      started: false,
      thirdGameSwapDone: false,
      matchFinished: false,

      teamInfo: {
        teamA: 'Team A',
        teamB: 'Team B',
      },

      matchConfig: {
        firstServerTeam: 'teamA',
      },

      prematch: {
        matchId: null,
        matchLabel: "",
      },

      history: [],
      matchStatus: "idle",   // idle | live | paused | finished
      tournamentMatchNumber: 1,
      revision: 0,
    }
  }

  let state = initialState()

  /* ---------------- HELPERS ---------------- */
  function getSnapshot(state) {
        return {
            score: state.score,
            players: state.players,
            server: state.server,
            courtSides: state.courtSides,
            gamesWon: state.gamesWon,
            setResults: state.setResults,
            lastSetResult: state.lastSetResult,
            gameNumber: state.gameNumber,
            started: state.started,
            thirdGameSwapDone: state.thirdGameSwapDone,
            matchFinished: state.matchFinished,
            matchStatus: state.matchStatus,   // ✅ ADD THIS
            teamInfo: state.teamInfo,   // 👈 REQUIRED
            revision: state.revision
        }
  }

  function snapshot() {
    state.history.push(JSON.parse(JSON.stringify(getSnapshot(state))))

    if (state.history.length > 100) {
        state.history.shift()
    }
  }

  function getOpponent(team) {
    return team === 'teamA' ? 'teamB' : 'teamA'
  }

  function setFullState(newState) {
    state = JSON.parse(JSON.stringify(newState));
  }

  function swapCourtsOnly() {
    const temp = state.courtSides.left
    state.courtSides.left = state.courtSides.right
    state.courtSides.right = temp
  }

  function isGameOver(a, b) {
    if ((a >= RULES.TARGET || b >= RULES.TARGET) && Math.abs(a - b) >= RULES.WIN_BY) {
      return true
    }
    if (a === RULES.MAX || b === RULES.MAX) return true
    return false
  }

  function updateServicePosition(team, sameServer) {
    const players = state.players[team]
    const score = state.score[team]
    const isEven = score % 2 === 0
    const shouldServeFrom = isEven ? 'RIGHT' : 'LEFT'

    if (sameServer) {
      const server = players[state.server.playerIndex]
      const partner = players.find(p => p !== server)

      server.court = shouldServeFrom
      partner.court = shouldServeFrom === 'RIGHT' ? 'LEFT' : 'RIGHT'
    } else {
      let idx = players.findIndex(p => p.court === shouldServeFrom)
      if (idx === -1) idx = 0

      state.server.team = team
      state.server.playerIndex = idx
    }
  }

  /* ---------------- CORE LOGIC ---------------- */

  function addPoint(courtSide) {
    if (state.matchFinished) return;
    if (state.matchStatus !== "live") return;   // 🔥 CRITICAL

    // ✅ Auto-start match on first rally
    /*if (state.matchStatus === "idle") {
      state.matchStatus = "live";
    }*/

    // ✅ If paused, resume automatically when scoring happens
    if (state.matchStatus === "paused") {
      state.matchStatus = "live";
    }

    snapshot()

    const team = state.courtSides[courtSide]

    if (!state.started) {
      const servingTeam = state.matchConfig.firstServerTeam;
      const rightIndex = state.players[servingTeam].findIndex(
        p => p.court === "RIGHT"
      );
      state.server.team = servingTeam;
      state.server.playerIndex = rightIndex === -1 ? 0 : rightIndex;
      state.started = true;
    }

    // clear popup on new rally
    if (state.lastSetResult && state.score.teamA === 0 && state.score.teamB === 0) {
      state.lastSetResult = null
    }

    state.score[team]++

    // ✅ Increase revision for sync
    state.revision = (state.revision || 0) + 1; 

    const sameServer = state.server.team === team
    updateServicePosition(team, sameServer)

    // 🔁 3rd set mid swap at 11
    if (state.gameNumber === 3 && !state.thirdGameSwapDone) {
      if (state.score.teamA === 11 || state.score.teamB === 11) {
        swapCourtsOnly()
        state.thirdGameSwapDone = true
      }
    }

    // 🏁 SET OVER
    if (isGameOver(state.score.teamA, state.score.teamB)) {
      const winner =
        state.score.teamA > state.score.teamB ? 'teamA' : 'teamB'

      state.gamesWon[winner]++

      state.setResults.push({
        teamA: state.score.teamA,
        teamB: state.score.teamB,
      })

      state.lastSetResult = {
        winner,
        teamA: state.score.teamA,
        teamB: state.score.teamB,
        setNumber: state.gameNumber,
      }

      // 🛑 CHECK IF MATCH OVER FIRST
      const isMatchOver = state.gamesWon[winner] === 2

      if (isMatchOver) {
        state.matchFinished = true
        state.matchStatus = "finished";
        return   // 🔒 DO NOT swap courts, DO NOT reset scores
      }

      // 🔁 Normal between-set behavior
      swapCourtsOnly()

      // winner serves next set
      state.server.team = winner
      state.server.playerIndex = 0

      state.gameNumber++
      state.score.teamA = 0
      state.score.teamB = 0
      state.started = false
      state.thirdGameSwapDone = false

    }
  }

  function clearLastSetResult() {
    state.lastSetResult = null;
    state.revision++;
  }

  function undo() {
    if (!state.history.length) return
    const previous = state.history.pop()
    Object.assign(state, previous)
  }

  function reset() {
    state = initialState()
  }

  function pauseMatch() {
    if (state.matchStatus === "live") {
      state.matchStatus = "paused";
    }
  }

  function resumeMatch() {
    if (state.matchStatus === "paused") {
      state.matchStatus = "live";
    }
  }

  function getState() {
    return JSON.parse(JSON.stringify(state))
  }

  function loadPrematchData(payload) {

    const { matchId, matchLabel, teamA, teamB } = payload;

    state.prematch.matchId = matchId;
    state.prematch.matchLabel = matchLabel;

    state.teamInfo.teamA = teamA.name;
    state.teamInfo.teamB = teamB.name;

    // Reset players with default RIGHT/LEFT
    state.players.teamA = teamA.players.map((p, i) => ({
      name: p,
      court: i === 0 ? "RIGHT" : "LEFT"
    }));

    state.players.teamB = teamB.players.map((p, i) => ({
      name: p,
      court: i === 0 ? "RIGHT" : "LEFT"
    }));

    // Default first server team
    state.matchConfig.firstServerTeam = "teamA";

    // Immediately align server with RIGHT court player
    const rightIndex = state.players.teamA.findIndex(
      p => p.court === "RIGHT"
    );

    state.server.team = "teamA";
    state.server.playerIndex = rightIndex === -1 ? 0 : rightIndex;

    state.started = false;
    state.matchFinished = false;
    state.matchStatus = "idle";

    state.score.teamA = 0;
    state.score.teamB = 0;
    state.gamesWon.teamA = 0;
    state.gamesWon.teamB = 0;
    state.setResults = [];
    state.lastSetResult = null;
    state.gameNumber = 1;
    state.thirdGameSwapDone = false;

    state.revision = (state.revision || 0) + 1;
  }

  function startMatch() {
    if (state.matchStatus !== "idle") return;

    state.matchStatus = "live";
    state.revision++;
  }

  // This swap function is for prematch screen.
  function swapPlayers(team) {

    const player1 = state.players[team][0];
    const player2 = state.players[team][1];

    // swap court only
    const tempCourt = player1.court;
    player1.court = player2.court;
    player2.court = tempCourt;

    // If swapped team is currently serving team,
    // we must update server.playerIndex
    if (state.server.team === team) {

      const rightIndex = state.players[team].findIndex(
        p => p.court === "RIGHT"
      );

      state.server.playerIndex = rightIndex === -1 ? 0 : rightIndex;
    }

    state.revision++;
  }

  // This swap function is for prematch screen.
  function swapTeams() {
    // Swap players
    const tempPlayers = state.players.teamA;
    state.players.teamA = state.players.teamB;
    state.players.teamB = tempPlayers;

    // Swap team names
    const tempName = state.teamInfo.teamA;
    state.teamInfo.teamA = state.teamInfo.teamB;
    state.teamInfo.teamB = tempName;

    // Swap games won
    const tempGames = state.gamesWon.teamA;
    state.gamesWon.teamA = state.gamesWon.teamB;
    state.gamesWon.teamB = tempGames;

    // Swap score (prematch usually 0-0)
    const tempScore = state.score.teamA;
    state.score.teamA = state.score.teamB;
    state.score.teamB = tempScore;

    state.revision++;
  }

  function startNewMatch() {
    const nextMatchNumber = state.tournamentMatchNumber + 1;
    const fresh = initialState();

    fresh.tournamentMatchNumber = nextMatchNumber;
    fresh.revision = state.revision + 1;

    state = fresh;
  }

  function setFirstServerTeam(team) {
    state.matchConfig.firstServerTeam = team;
    const rightIndex = state.players[team].findIndex(
      p => p.court === "RIGHT"
    );
    state.server.team = team;
    state.server.playerIndex = rightIndex === -1 ? 0 : rightIndex;
    state.revision++;
  }

  return { addPoint, undo, reset, getState, 
            pauseMatch, resumeMatch, startMatch,
            setFullState, loadPrematchData, swapPlayers, swapTeams,
            clearLastSetResult, startNewMatch , setFirstServerTeam   
  }
}
