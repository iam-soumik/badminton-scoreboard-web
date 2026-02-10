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
  const prevServerRef = useRef(game.server)
  const leftPlayers = game.players?.left || []

  function isServingPlayer(team, player) {
    if (game.server.team !== team) return false
    const server = game.players[team][game.server.playerIndex]
    return server?.name === player.name
  }

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  function score(team) {
    if (!confirmAction(`Add point to ${team.toUpperCase()}?`)) return

    const prevServer = prevServerRef.current
    dispatch(addPoint(team))

    setTimeout(() => {
      const updated = store.getState().game
      const newServer = updated.server

      const leftScore = updated.score.left
      const rightScore = updated.score.right

      // Score announcement: server team first
      const scoreText =
        newServer.team === 'left'
          ? `${leftScore} ${rightScore}`
          : `${rightScore} ${leftScore}`

      const serviceChanged =
        prevServer.team !== newServer.team ||
        prevServer.playerIndex !== newServer.playerIndex

      if (serviceChanged && prevServer.team !== newServer.team) {
        // Service changed to other team
        speak(
          `Service over. ${newServer.team === 'left' ? 'Team A' : 'Team B'} to serve. ${scoreText}`
        )
      } else {
        // Same server (service continues)
        speak(scoreText)
      }

      // update ref AFTER announcement
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
          {['LEFT', 'RIGHT'].map((side) => {
            const player = game.players.left.find(p => p.court === side)
            if (!player) return null

            //const isServing = servingPlayer?.name === player.name

            return (
              <div
                key={player.name}
                className={`player-badge ${
                  isServingPlayer('left', player)
                    ? 'serving-player'
                    : 'partner-player'
                }`}
              >
                {player.name}
              </div>
            )
          })}
          <div className="score">{game.score.left}</div>
          <button className="score-btn" onClick={() => score('left')}>+1</button>
        </div>

        <div className="center-panel">
          <button className="undo-btn" onClick={undoLast}>UNDO</button>
          <div className="game-info">
            Game {game.gameNumber} • Server: {game.server.team.toUpperCase()}
          </div>
        </div>
		
        <div className="team right">
          {['RIGHT', 'LEFT'].map((side) => {
            const player = game.players.right.find(p => p.court === side)
            if (!player) return null

            //const isServing = servingPlayer?.name === player.name

            return (
              <div
                key={player.name}
                className={`player-badge ${
                  isServingPlayer('right', player)
                    ? 'serving-player'
                    : 'partner-player'
                }`}
              >
                {player.name}
              </div>
            )
          })}

          <div className="score">{game.score.right}</div>
          <button className="score-btn" onClick={() => score('right')}>+1</button>
        </div>
      </main>
    </div>
  )
}
