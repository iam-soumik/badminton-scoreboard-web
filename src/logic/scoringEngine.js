export function createScoringEngine() {
    console.log('🔥 scoringEngine loaded')
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
        }
    }


    function updateServicePosition(state, team) {
        const players = state.players[team]
        const score = state.score[team]

        const isLeftTeam = team === 'left'
        const isEven = score % 2 === 0

        // FACE-TO-FACE BWF RULE
        const shouldServeFrom =
            isLeftTeam
                ? (isEven ? 'RIGHT' : 'LEFT')
                : (isEven ? 'LEFT' : 'RIGHT')

        let serverIndex = players.findIndex(p => p.court === shouldServeFrom)

        // defensive alignment
        if (serverIndex === -1) {
            players[0].court = shouldServeFrom
            players[1].court = shouldServeFrom === 'RIGHT' ? 'LEFT' : 'RIGHT'
            serverIndex = 0
        }

        state.server.team = team
        state.server.playerIndex = serverIndex
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


    function isGameOver(l, r) {
        if ((l >= RULES.TARGET || r >= RULES.TARGET) && Math.abs(l - r) >= RULES.WIN_BY) {
            return true
        }
        if (l === RULES.MAX || r === RULES.MAX) return true
        return false
    }

    function addPoint(team) {
        snapshot()
        state.started = true

        state.score[team]++

        updateServicePosition(state, team)

        // third game mid swap
        if (state.gameNumber === 3 && !state.thirdGameSwapDone) {
            if (state.score.left === 11 || state.score.right === 11) {
                swapSidesInternal()
                state.thirdGameSwapDone = true
            }
        }

        // game over
        if (isGameOver(state.score.left, state.score.right)) {
            const winner = state.score.left > state.score.right ? 'left' : 'right'
            state.gamesWon[winner]++

            if (state.gamesWon.left + state.gamesWon.right < 3) {
                state.gameNumber++
                state.score = { left: 0, right: 0 }
                state.started = false
            }
        }
    }

    function swapSidesInternal() {
        // swap scores
        const s = state.score.left
        state.score.left = state.score.right
        state.score.right = s

        // swap server team ONLY
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
