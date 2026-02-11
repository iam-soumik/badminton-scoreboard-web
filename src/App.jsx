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
  const leftPlayers = game.players?.left || []

  const MAX_SETS = 3
  const setGrid = Array.from({ length: MAX_SETS }, (_, i) => {
    const completedSet = game.setResults[i]

    if (completedSet) {
      return {
        left: completedSet.left,
        right: completedSet.right,
        status: 'completed',
      }
    }

    if (i + 1 === game.gameNumber) {
      return {
        left: game.score.left,
        right: game.score.right,
        status: 'current',
      }
    }

    return {
      left: '',
      right: '',
      status: 'future',
    }
  })


  function isServingPlayer(team, player) {
    if (game.server.team !== team) return false
    const server = game.players[team][game.server.playerIndex]
    return server?.name === player.name
  }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (game.lastSetResult) {
      setSetPopup(game.lastSetResult)

      speak(
        `Set won by ${
          game.lastSetResult.winner === 'left' ? 'Team A' : 'Team B'
        }. ${game.lastSetResult.left} ${game.lastSetResult.right}`
      )
    }
  }, [game.lastSetResult])

  function score(team) {
    const prevServer = prevServerRef.current
    dispatch(addPoint(team))

    setTimeout(() => {
      const updated = store.getState().game

      // 🏆 1️⃣ SET WON ANNOUNCEMENT
      if (updated.lastSetResult) {
        const result = updated.lastSetResult

        speak(
          `Set won by ${result.winner === 'left' ? 'Team A' : 'Team B'}. 
          ${result.left} ${result.right}`
        )

        // clear after announcing once
        prevServerRef.current = updated.server
        return
      }

      // 🎯 2️⃣ NORMAL POINT ANNOUNCEMENT
      const newServer = updated.server
      const leftScore = updated.score.left
      const rightScore = updated.score.right

      const scoreText =
        newServer.team === 'left'
          ? `${leftScore} ${rightScore}`
          : `${rightScore} ${leftScore}`

      const serviceChanged =
        prevServer.team !== newServer.team ||
        prevServer.playerIndex !== newServer.playerIndex

      if (serviceChanged && prevServer.team !== newServer.team) {
        speak(
          `Service over. ${newServer.team === 'left' ? 'Team A' : 'Team B'} to serve. ${scoreText}`
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

      <main className="court">
        <div className="team left">
          {game.players.left.map(player => (
            <div
              key={player.name}
              className={`player-badge
                court-${player.court.toLowerCase()}
                ${isServingPlayer('left', player) ? 'serving-player' : 'partner-player'}
              `}
            >
              {player.name}
            </div>
          ))}
          <div className="team-footer">
            <div className="team-score">{game.score.left}</div>
            <button className="score-btn" onClick={() => score('left')}>+1</button>
          </div>
        </div>

        <div className="center-panel">
          <div className="set-grid">
            {/* Header Row */}
            <div className="cell header"></div>
            {setGrid.map((_, i) => (
              <div key={i} className="cell header">Set {i + 1}</div>
            ))}

            {/* Team A Row */}
            <div className="cell team-name">{game.teamInfo.left}</div>
            {setGrid.map((set, i) => (
              <div
                key={i}
                className={`cell score ${set.status}`}
              >
                {set.left}
              </div>
            ))}

            {/* Team B Row */}
            <div className="cell team-name">{game.teamInfo.right}</div>
            {setGrid.map((set, i) => (
              <div
                key={i}
                className={`cell score ${set.status}`}
              >
                {set.right}
              </div>
            ))}
          </div>

          <button className="undo-btn" onClick={undoLast}>UNDO</button>
          <div className="game-info">
            Game {game.gameNumber} • Server: {game.server.team.toUpperCase()}
          </div>
        </div>
		
        <div className="team right">
          {game.players.right.map(player => (
            <div
              key={player.name}
              className={`player-badge
                court-${player.court.toLowerCase()}
                ${isServingPlayer('right', player) ? 'serving-player' : 'partner-player'}
              `}
            >
              {player.name}
            </div>
          ))}

          <div className="team-footer">
            <div className="team-score">{game.score.right}</div>
            <button className="score-btn" onClick={() => score('right')}>+1</button>
          </div>
        </div>

        {setPopup && (
          <div className="set-popup">
            <div className="popup-card">
              <h2>SET RESULT</h2>
              <p>
                {setPopup.winner === 'left' ? 'Team A' : 'Team B'} won
              </p>
              <p>
                {setPopup.left} - {setPopup.right}
              </p>
              <button onClick={() => setSetPopup(null)}>OK</button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
