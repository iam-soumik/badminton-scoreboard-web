import { useDispatch, useSelector } from 'react-redux'
import { addPoint, undo } from './redux/gameSlice'
import { confirmAction } from './utils/confirm'
import { useEffect, useState, useRef } from 'react'
import { speak } from './utils/speak'
import { store } from './redux/store'

export default function App() {
  const dispatch = useDispatch()
  const game = useSelector(state => state.game)

  const [time, setTime] = useState(new Date())
  const [setPopup, setSetPopup] = useState(null)
  const prevServerRef = useRef(game.server)

  /* 🔁 Resolve visual → logical mapping */
  const leftTeam = game.courtSides.left
  const rightTeam = game.courtSides.right

  const leftPlayers = game.players[leftTeam]
  const rightPlayers = game.players[rightTeam]

  /* 🧮 SET GRID (TV STYLE) */
  const MAX_SETS = 3
  const setGrid = Array.from({ length: MAX_SETS }, (_, i) => {
    const completed = game.setResults[i]

    if (completed) {
      return {
        teamA: completed.teamA,
        teamB: completed.teamB,
        status: 'completed',
      }
    }

    if (i + 1 === game.gameNumber) {
      return {
        teamA: game.score.teamA,
        teamB: game.score.teamB,
        status: 'current',
      }
    }

    return { teamA: '', teamB: '', status: 'future' }
  })

  /* 🎯 SERVING INDICATOR */
  function isServingPlayer(team, player) {
    if (game.matchFinished) return false
    if (game.server.team !== team) return false
    return game.players[team][game.server.playerIndex]?.name === player.name
  }

  /* ⏰ CLOCK */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  /* 🏆 SET POPUP + ANNOUNCE */
  useEffect(() => {
    if (!game.lastSetResult) return

    setSetPopup(game.lastSetResult)

    const r = game.lastSetResult
    const winnerScore = r.winner === 'teamA' ? r.teamA : r.teamB
    const loserScore = r.winner === 'teamA' ? r.teamB : r.teamA

    speak(
      `Set won by ${game.teamInfo[r.winner]}.  ${winnerScore} ${loserScore}`
    )

  }, [game.lastSetResult])

  function announceMatchResult() {
    const winner = game.gamesWon.teamA === 2 ? 'teamA' : 'teamB'
    const loser  = winner === 'teamA' ? 'teamB' : 'teamA'

    const winnerName = winner === 'teamA' ? 'Team A' : 'Team B'
    const loserName = loser === 'teamA' ? 'Team A' : 'Team B'

    const winnerScore = game.gamesWon[winner]
    const loserScore = game.gamesWon[loser]

    speak(
      `${winnerName} wins the match by ${winnerScore} to ${loserScore}`
    )
  }

  function announceCurrentScore() {
    if (game.matchFinished) return

    const { teamA, teamB } = game.score

    speak(`Current score. Team A ${teamA}. Team B ${teamB}.`)
  }


  /* ➕ SCORE */
  function score(courtSide) {
    const prevServer = prevServerRef.current
    dispatch(addPoint(courtSide))

    setTimeout(() => {
      const updated = store.getState().game

      if (updated.lastSetResult && !updated.matchFinished) {
        prevServerRef.current = updated.server
        return
      }

      const newServer = updated.server
      const sA = updated.score.teamA
      const sB = updated.score.teamB

      const scoreText =
        newServer.team === 'teamA' ? `${sA} ${sB}` : `${sB} ${sA}`

      const serviceChanged =
        prevServer.team !== newServer.team ||
        prevServer.playerIndex !== newServer.playerIndex

      if (serviceChanged && prevServer.team !== newServer.team) {
        speak(
          `Service over. ${updated.teamInfo[newServer.team]} to serve. ${scoreText}`
        )
      } else {
        speak(scoreText)
      }

      prevServerRef.current = newServer
    }, 80)
  }

  function undoLast() {
    if (!confirmAction('Undo last point?')) return
    dispatch(undo())
  }

  function undoFromPopup() {
    if (!confirmAction('Undo last point?')) return
    dispatch(undo())
    setSetPopup(null)   // 👈 CLOSE POPUP
 }

  /* ================= UI ================= */

  return (
    <div className="app-root">
      <header className="top-bar">
        <div className="tournament-title">
          NASIBPUR BRAHMINPARA BADMINTON TOURNAMENT
        </div>
        <div className="date-time">
          {time.toLocaleDateString()} • {time.toLocaleTimeString()}
        </div>
      </header>

      <main className={`court ${game.matchFinished ? 'match-finished' : ''}`}>

        {/* LEFT COURT */}
        <div className="team left">
          {leftPlayers.map(player => (
            <div
              key={player.name}
              className={`player-badge court-${player.court.toLowerCase()}
                ${isServingPlayer(leftTeam, player) ? 'serving-player' : 'partner-player'}
              `}
            >
              {player.name}
            </div>
          ))}
          <div className="team-footer">
            <div className="team-score">{game.score[leftTeam]}</div>
            <button
              className="score-btn"
              onClick={() => score('left')}
              disabled={game.matchFinished}
            >
              +1
            </button>
          </div>
        </div>

        {/* CENTER PANEL */}
        <div className="center-panel">

          <div className="set-grid">
            <div className="cell header"></div>
            {setGrid.map((_, i) => (
              <div key={i} className="cell header">Set {i + 1}</div>
            ))}

            <div className="cell team-name">{game.teamInfo.teamA}</div>
            {setGrid.map((s, i) => (
              <div key={i} className={`cell score ${s.status}`}>{s.teamA}</div>
            ))}

            <div className="cell team-name">{game.teamInfo.teamB}</div>
            {setGrid.map((s, i) => (
              <div key={i} className={`cell score ${s.status}`}>{s.teamB}</div>
            ))}
          </div>
          <div className="utility-div">
            <button className="utility-btn" onClick={undoLast}>Undo</button>
            <button className="utility-btn" onClick={announceCurrentScore}> Score </button>
          </div>
          

          <div className="game-info">
            Game {game.gameNumber} • Server: {game.teamInfo[game.server.team]}
          </div>
        </div>

        {/* RIGHT COURT */}
        <div className="team right">
          {rightPlayers.map(player => (
            <div
              key={player.name}
              className={`player-badge court-${player.court.toLowerCase()}
                ${isServingPlayer(rightTeam, player) ? 'serving-player' : 'partner-player'}
              `}
            >
              {player.name}
            </div>
          ))}
          <div className="team-footer">
            <div className="team-score">{game.score[rightTeam]}</div>
            <button
              className="score-btn"
              onClick={() => score('right')}
              disabled={game.matchFinished}
            >
              +1
            </button>
          </div>
        </div>

        {/* SET POPUP */}
        {setPopup && (
          <div className="set-popup">
            <div className="popup-card">
              <h2>SET RESULT</h2>
              <p>{game.teamInfo[setPopup.winner]} won</p>
              <p>
                {setPopup.winner === 'teamA'
                  ? `${setPopup.teamA} - ${setPopup.teamB}`
                  : `${setPopup.teamB} - ${setPopup.teamA}`}
              </p>
              <div className="popup-actions">
                <button onClick={undoFromPopup}>Undo</button>
                {game.matchFinished  && <button onClick={announceMatchResult}>Announce</button> }
                <button onClick={() => setSetPopup(null)}>OK</button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}
