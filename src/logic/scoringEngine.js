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
        firstServerPlayerIndex: 0,
      },

      history: [],
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
            teamInfo: state.teamInfo,   // 👈 REQUIRED
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
  if (state.matchFinished) return

  snapshot()

  const team = state.courtSides[courtSide]

  if (!state.started) {
    state.server.team = state.matchConfig.firstServerTeam
    state.server.playerIndex = state.matchConfig.firstServerPlayerIndex
    state.started = true
  }

  // clear popup on new rally
  if (state.lastSetResult && state.score.teamA === 0 && state.score.teamB === 0) {
    state.lastSetResult = null
  }

  state.score[team]++

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


  function undo() {
    if (!state.history.length) return
    const previous = state.history.pop()
    Object.assign(state, previous)
  }

  function reset() {
    state = initialState()
  }

  function getState() {
    return JSON.parse(JSON.stringify(state))
  }

  return { addPoint, undo, reset, getState }
}
