import { useDispatch, useSelector } from 'react-redux'
import { addPoint, pauseMatch, resumeMatch, undo } from './redux/gameSlice'
import { confirmAction } from './utils/confirm'
import { useEffect, useState, useRef } from 'react'
import { speak } from './utils/speak'
import { store } from './redux/store'
import { db } from "./firebase";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { buildSystemName, getDeviceId, getDeviceInfo } from "./utils/device";
import AdminPanel from './pages/AdminPanel'
import { useDeviceStatus } from './redux/hooks/useDeviceStatus'

import { manualTwoWaySync } from './utils/syncMatchManually'
import { pushMatchState } from "./firebase/matchSync";
import { fetchMatchState } from "./redux/actions/loadMatchFromFirestore";


export default function App() {
  const dispatch = useDispatch()
  const game = useSelector(state => state.game)

  const [time, setTime] = useState(new Date())
  const [setPopup, setSetPopup] = useState(null)
  const [projectorSyncOn, setProjectorSyncOn] = useState(false);
  const prevServerRef = useRef(game.server)

  const device = useDeviceStatus();
  const canScore = device?.mode === "primary" || device?.mode === "active";

  /* 🔁 Resolve visual → logical mapping */
  const leftTeam = game.courtSides.left
  const rightTeam = game.courtSides.right

  const leftPlayers = game.players[leftTeam]
  const rightPlayers = game.players[rightTeam]

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

    speakIfPrimary(
      `Set won by ${game.teamInfo[r.winner]}.  ${winnerScore} ${loserScore}`
    )

  }, [game.lastSetResult])

  /* 🔄 PROJECTOR SYNC */
  useEffect(() => {
    if (device?.mode !== "projector") return;
    if (!projectorSyncOn) return;
    if (game.matchStatus !== "live") return;

    console.log("📽️ Projector Sync Running");

    const interval = setInterval(() => {
      fetchMatchState(dispatch);
    }, 5000);

    return () => clearInterval(interval);

  }, [device?.mode, projectorSyncOn, game.matchStatus]);

  /* ✅ 1️⃣ Device Register (Runs once) */
  useEffect(() => {
    const deviceId = getDeviceId();
    const deviceRef = doc(db, "devices", deviceId);

    const registerDevice = async () => {
      const info = await getDeviceInfo();
      const systemName = buildSystemName(info);

      await setDoc(
        deviceRef,
        {
          deviceId,
          role: "admin",
          mode: "standby",
          systemName,
          nickName: "",
          createdAt: serverTimestamp(),
          lastHeartbeat: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Device registered:", deviceId);
    };

    registerDevice();
  }, []);

  /* ✅ 2️⃣💓 HEARTBEAT (Only Active + Live Match) */
  useEffect(() => {
    const deviceId = getDeviceId();
    const deviceRef = doc(db, "devices", deviceId);

    let intervalId;

    // ✅ Heartbeat allowed only when device participates in scoring
    const shouldHeartbeat =
      (device?.mode === "primary" || device?.mode === "active") &&
      game.matchStatus === "live";

    if (!shouldHeartbeat) {
      console.log("🛑 Heartbeat OFF (not needed)");
      return;
    }

    console.log("💓 Heartbeat ON");

    intervalId = setInterval(async () => {
      await updateDoc(deviceRef, {
        lastHeartbeat: serverTimestamp(),
      });

      console.log("💓 Heartbeat sent");
    }, 90000);

    // Cleanup when paused/ended or device becomes standby
    return () => {
      clearInterval(intervalId);
      console.log("🛑 Heartbeat stopped");
    };
  }, [device?.mode, game.matchStatus]);


  /* Primary Auto Push to Firestore (ONLY LIVE) */
  useEffect(() => {
    if (device?.mode !== "primary") return;
    if (game.matchStatus !== "live") return;

    pushMatchState(game, getDeviceId());

  }, [game, device?.mode, game.matchStatus]);

  function speakIfPrimary(text) {
    if (device?.mode === "primary") {
      speak(text)
    }
  }

  function announceMatchResult() {
    if (device?.mode !== "primary") return;   // 🔒 ONLY PRIMARY

    const winner = game.gamesWon.teamA === 2 ? 'teamA' : 'teamB'
    const loser  = winner === 'teamA' ? 'teamB' : 'teamA'

    const winnerName = winner === 'teamA' ? 'Team A' : 'Team B'
    const loserName = loser === 'teamA' ? 'Team A' : 'Team B'

    const winnerScore = game.gamesWon[winner]
    const loserScore = game.gamesWon[loser]

    speakIfPrimary(
      `${winnerName} wins the match by ${winnerScore} to ${loserScore}`
    )
  }

  function announceCurrentScore() {
    if (!canScore) return;          // 🔒
    if (game.matchFinished) return

    const { teamA, teamB } = game.score

    speakIfPrimary(`Current score. Team A ${teamA}. Team B ${teamB}.`)
  }

  /* ➕ SCORE */
  function score(courtSide) {
    if (!canScore) return;
    if (game.matchFinished) return;

    const prevServer = prevServerRef.current;

    // ✅ Local scoring always. Allow scoring even if paused (engine will auto-resume)
    dispatch(addPoint(courtSide));

    setTimeout(async () => {
      const updated = store.getState().game;

      // 🛑 If set just ended → do not announce point again
      if (updated.lastSetResult && !updated.matchFinished) {
        prevServerRef.current = updated.server;
        return;
      }

      // ✅ PRIMARY pushes score to Firestore (ONLY ONE WRITE)
      /*if (device?.mode === "primary") {
        await pushMatchState(updated);
      }*/

      // 🎯 Announcement Logic
      const newServer = updated.server;

      const sA = updated.score.teamA;
      const sB = updated.score.teamB;

      // Server team score first
      const scoreText =
        newServer.team === "teamA"
          ? `${sA} ${sB}`
          : `${sB} ${sA}`;

      // Detect service change
      const serviceChanged =
        prevServer.team !== newServer.team ||
        prevServer.playerIndex !== newServer.playerIndex;

      if (serviceChanged && prevServer.team !== newServer.team) {
        // 🔄 Service Over
        speakIfPrimary(
          `Service over. ${updated.teamInfo[newServer.team]} to serve. ${scoreText}`
        );
      } else {
        // ✅ Normal rally announce
        speakIfPrimary(scoreText);
      }

      // Update server ref
      prevServerRef.current = newServer;

    }, 80);
  }


  function undoLast() {
    if (!canScore) return;          // 🔒
    if (!confirmAction('Undo last point?')) return
    dispatch(undo())
  }

  function undoFromPopup() {
    if (!canScore) return;          // 🔒
    if (!confirmAction('Undo last point?')) return
    dispatch(undo())
    setSetPopup(null)   // 👈 CLOSE POPUP
 }

 async function manualSync() {
  if (device?.mode !== "active") return;

  const confirm = window.confirm(
    "This will overwrite server score and take control. Continue?"
  );

  if (!confirm) return;

  const localState = store.getState().game;
  const matchRef = doc(db, "matches", "live");

  await setDoc(matchRef, {
    gameState: localState,
    updatedAt: serverTimestamp(),
    updatedBy: getDeviceId(),
  });

  alert("✅ Synced successfully. Now set this device as PRIMARY in Admin Panel.");
}


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
  /* ================= UI ================= */

  return (
    <div className="app-root">
      <AdminPanel />
      <header className="top-bar">
        <div className="tournament-title">
          NASIBPUR BRAHMINPARA BADMINTON TOURNAMENT
        </div>
        <div className="date-time">
          {time.toLocaleDateString()} • {time.toLocaleTimeString()}
        </div>
      </header>

      <main className={`court ${game.matchFinished ? 'match-finished' : ''}`}>

        {device?.mode === "projector" && (
          <div className="projector-controls">
            <h3>📽️ Projector Display Mode</h3>

            {!projectorSyncOn ? (
              <button onClick={() => setProjectorSyncOn(true)}>
                ▶ Start Live Sync
              </button>
            ) : (
              <button onClick={() => setProjectorSyncOn(false)}>
                ⏸ Stop Sync
              </button>
            )}
          </div>
        )}

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
              disabled={game.matchFinished || !canScore}
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
            <button className="utility-btn" disabled={!canScore} onClick={undoLast}>Undo</button>
            <button className="utility-btn" disabled={!canScore} onClick={announceCurrentScore}> Score </button>
            <button
              className="utility-btn"
              disabled={device?.mode === "standby" || game.matchStatus !== "live"}
              onClick={() =>
                manualTwoWaySync(device?.mode, getDeviceId(), dispatch)
              }
            >
              🔄 Manual Sync
            </button>
            {game.matchStatus === "live" && (
              <button
                className="utility-btn"
                onClick={() => dispatch(pauseMatch())}
              >
                ⏸ Pause
              </button>
            )}

            {game.matchStatus === "paused" && (
              <button
                className="utility-btn"
                onClick={() => dispatch(resumeMatch())}
              >
                ▶ Resume
              </button>
            )}

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
              disabled={game.matchFinished || !canScore}
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
                <button disabled={!canScore} onClick={undoFromPopup}>Undo</button>
                {game.matchFinished  && device?.mode === "primary" && (
                  <button onClick={announceMatchResult}>Announce</button> 
                )}
                <button onClick={() => setSetPopup(null)}>OK</button>
              </div>

            </div>
          </div>
        )}

      </main>
    </div>
  )
}
