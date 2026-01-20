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
        }
    }


    function rotateServingTeam(team, score) {
        const isEven = score % 2 === 0

        if (isEven) {
            team.players[0].court = 'RIGHT'
            team.players[1].court = 'LEFT'
        } else {
            team.players[0].court = 'LEFT'
            team.players[1].court = 'RIGHT'
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

        // increment score
        state.score[team]++

        const sameServer = state.server.team === team
        const players = state.players[team]
        const score = state.score[team]

        // -------- SAME SERVER (rotation within team) --------
        if (sameServer) {
            const isLeftTeam = team === 'left'

            const shouldServeFrom =
                score % 2 === 0
                    ? (isLeftTeam ? 'RIGHT' : 'LEFT')
                    : (isLeftTeam ? 'LEFT' : 'RIGHT')

            // find current server + partner
            const serverPlayer = players[state.server.playerIndex]
            const partnerPlayer = players.find(p => p !== serverPlayer)

            // enforce correct court positions
            serverPlayer.court = shouldServeFrom
            partnerPlayer.court = shouldServeFrom === 'RIGHT' ? 'LEFT' : 'RIGHT'

            // defensive: realign server index based on court
            state.server.playerIndex = players.findIndex(
                p => p.court === shouldServeFrom
            )
        }

        // -------- SERVICE CHANGE --------
        else {
            state.server.team = team

            // service always starts from RIGHT court
            const serverIndex = players.findIndex(p => p.court === 'RIGHT')

            // defensive fallback
            state.server.playerIndex = serverIndex !== -1 ? serverIndex : 0
        }

        // -------- THIRD GAME MID-COURT SWAP --------
        if (state.gameNumber === 3 && !state.thirdGameSwapDone) {
            if (state.score.left === 11 || state.score.right === 11) {
                swapSidesInternal()
                state.thirdGameSwapDone = true
            }
        }

        // -------- GAME OVER --------
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
        const s = state.score.left
        state.score.left = state.score.right
        state.score.right = s
        state.server = state.server === 'left' ? 'right' : 'left'
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
