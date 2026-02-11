export function createScoringEngine() {
    const RULES = {
        TARGET: 21,
        WIN_BY: 2,
        MAX: 30,
        MAX_GAMES: 3,
    }

    function initialState() {
        return {
            score: { left: 0, right: 0 },

            players: {
            left: [
                { name: 'Player A1', court: 'RIGHT' }, 
                { name: 'Player A2', court: 'LEFT' },
            ],
            right: [
                { name: 'Player B1', court: 'RIGHT' },
                { name: 'Player B2', court: 'LEFT' },
            ],
            },

            server: { team: 'left', playerIndex: 0 },
            gameNumber: 1,
            gamesWon: { left: 0, right: 0 },
            history: [],
            started: false,
            thirdGameSwapDone: false,
            setResults: [],          // [{ left: 21, right: 18 }]
            lastSetResult: null,     // { winner, left, right }
            teamInfo: {
                left: "Team A",
                right: "Team B",
            },
            matchConfig: {
                firstServerTeam: 'left',
                firstServerPlayerIndex: 0,
            }

        }
    }

    function swapCourtsOnly() {
        const tempPlayers = state.players.left
        state.players.left = state.players.right
        state.players.right = tempPlayers
    }

    function updateServicePosition(state, team, sameServer) {
        const players = state.players[team]
        const score = state.score[team]

        const isLeftTeam = team === 'left'
        const isEven = score % 2 === 0

        // Face-to-face BWF rule
        const shouldServeFrom = isEven ? 'RIGHT' : 'LEFT'

        if (sameServer) {
            // 🔁 SAME SERVER → SWAP COURTS
            const server = players[state.server.playerIndex]
            const partner = players.find(p => p !== server)

            server.court = shouldServeFrom
            partner.court = shouldServeFrom === 'RIGHT' ? 'LEFT' : 'RIGHT'
        } else {
            // 🔄 SERVICE CHANGE → PICK PLAYER ALREADY ON CORRECT COURT
            let serverIndex = players.findIndex(p => p.court === shouldServeFrom)

            // defensive fallback
            if (serverIndex === -1) {
                players[0].court = shouldServeFrom
                players[1].court = shouldServeFrom === 'RIGHT' ? 'LEFT' : 'RIGHT'
                serverIndex = 0
            }

            state.server.team = team
            state.server.playerIndex = serverIndex
        }
    }

    let state = initialState()

    function snapshot() {
        state.history.push(
            JSON.parse(JSON.stringify({
                score: state.score,
                players: state.players,
                server: state.server,
                gameNumber: state.gameNumber,
                gamesWon: state.gamesWon,
                started: state.started,
                thirdGameSwapDone: state.thirdGameSwapDone,
            }))
        )
    }

    function swapPlayerPositions(team) {
        const players = state.players[team]
        const temp = players[0].court
        players[0].court = players[1].court
        players[1].court = temp
    }


    function isGameOver(l, r) {
        if ((l >= RULES.TARGET || r >= RULES.TARGET) && Math.abs(l - r) >= RULES.WIN_BY) {
            return true
        }
        if (l === RULES.MAX || r === RULES.MAX) return true
        return false
    }

    function addPoint(team) {
        if (state.gamesWon.left === 2 || state.gamesWon.right === 2) {
            return
        }
        snapshot()
        if (!state.started && state.gameNumber === 1) {
            state.server.team = state.matchConfig.firstServerTeam
            state.server.playerIndex = state.matchConfig.firstServerPlayerIndex
        }

        state.started = true

        // 🧹 Clear previous set result ONLY on first rally of new set
        if (
            state.lastSetResult &&
            state.score.left === 0 &&
            state.score.right === 0
        ) {
            state.lastSetResult = null
        }

        // ➕ Add point
        state.score[team]++

        const sameServer = state.server.team === team
        updateServicePosition(state, team, sameServer)

        // 🔁 3rd game mid-court swap at 11
        if (state.gameNumber === 3 && !state.thirdGameSwapDone) {
            if (state.score.left === 11 || state.score.right === 11) {
                swapSidesFull()
                state.thirdGameSwapDone = true
            }
        }

        // 🏁 SET OVER
        if (isGameOver(state.score.left, state.score.right)) {
            const winner = state.score.left > state.score.right ? 'left' : 'right'
            state.gamesWon[winner]++

            // 📊 Save set history
            state.setResults.push({
                left: state.score.left,
                right: state.score.right,
            })

            state.lastSetResult = {
                winner,
                left: state.score.left,
                right: state.score.right,
                setNumber: state.gameNumber,
            }

            // 🔁 Swap physical court sides only
            swapCourtsOnly()

            // 🏆 Winner serves next set
            state.server.team = winner
            state.server.playerIndex = 0   // you can make configurable later

            if (state.gamesWon.left + state.gamesWon.right < RULES.MAX_GAMES) {
                state.gameNumber++
                state.score = { left: 0, right: 0 }
                state.started = false
                state.thirdGameSwapDone = false
            }
        }

    }


    function swapSidesFull() {
        // swap players
        const tempPlayers = state.players.left
        state.players.left = state.players.right
        state.players.right = tempPlayers

        // swap scores
        const s = state.score.left
        state.score.left = state.score.right
        state.score.right = s

        // swap games won
        const g = state.gamesWon.left
        state.gamesWon.left = state.gamesWon.right
        state.gamesWon.right = g

        // swap server team
        state.server.team = state.server.team === 'left' ? 'right' : 'left'
    }

    function undo() {
        if (!state.history.length) return

        const last = state.history.pop()

        state.score = last.score
        state.players = last.players
        state.server = last.server
        state.gameNumber = last.gameNumber
        state.gamesWon = last.gamesWon
        state.started = last.started
        state.thirdGameSwapDone = last.thirdGameSwapDone
    }


    function reset() {
        state = initialState()
    }

    function getState() {
        return JSON.parse(JSON.stringify(state))
    }

    return { addPoint, undo, reset, getState }
}
