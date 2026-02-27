import { useDispatch, useSelector } from 'react-redux'
import { addPoint, pauseMatch, resumeMatch, undo } from '../redux/gameSlice'
import { useEffect, useState, useRef } from 'react'
import { speak } from '../utils/speak'
import { store } from '../redux/store'
import { getDeviceId } from "../utils/device";
import { pushMatchState } from "../firebase/matchSync";

import CenterPanel from '../components/CenterPanel';
import TopBar from '../components/TopBar';
import LeftTeamPanel from '../components/LeftTeamPanel';
import RightTeamPanel from '../components/RightTeamPanel';
import SetPopup from '../components/SetPopup';
import { manualTwoWaySync } from '../utils/syncMatchManually'
import { doc, updateDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import confirmAction from '../utils/utility'

export default function ScoreboardScreen({ device }) {

  const dispatch = useDispatch();
  const game = useSelector(state => state.game);

  const [setPopup, setSetPopup] = useState(null);
  const prevServerRef = useRef(game.server);

  const canScore =
    device?.mode === "primary" ||
    device?.mode === "active";

  useEffect(() => {
    prevServerRef.current = game.server;
  }, [game.server]);

  /* 🔥 Primary Auto Push to Firestore (ONLY LIVE) */
  useEffect(() => {
    if (device?.mode !== "primary") return;
    if (game.matchStatus !== "live") return;

    pushMatchState(game, getDeviceId());

  }, [game, device?.mode, game.matchStatus]);

  /* ✅ 💓 HEARTBEAT (Only Active + Live Match) */
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

  function score(courtSide) {
    if (!canScore) return;
    if (game.matchFinished) return;

    const prevServer = prevServerRef.current;

    // ✅ Always local-first scoring
    dispatch(addPoint(courtSide));

    setTimeout(() => {

        const updated = store.getState().game;

        // 🛑 If set just ended → don't double announce
        if (updated.lastSetResult && !updated.matchFinished) {
        prevServerRef.current = updated.server;
        return;
        }

        const newServer = updated.server;

        const sA = updated.score.teamA;
        const sB = updated.score.teamB;

        // 🎯 Server team score first
        const scoreText =
        newServer.team === "teamA"
            ? `${sA} ${sB}`
            : `${sB} ${sA}`;

        // 🔄 Detect service change
        const serviceChanged =
        prevServer.team !== newServer.team ||
        prevServer.playerIndex !== newServer.playerIndex;

        if (serviceChanged && prevServer.team !== newServer.team) {

        speakIfPrimary(
            `Service over. ${updated.teamInfo[newServer.team]} to serve. ${scoreText}`
        );

        } else {

        speakIfPrimary(scoreText);

        }

        prevServerRef.current = newServer;

    }, 80);
  }

  

  function isServingPlayer(team, player) {
    if (game.matchFinished) return false;
    if (game.server.team !== team) return false;

    return (
        game.players[team][game.server.playerIndex]?.name === player.name
    );
  }

  function speakIfPrimary(text) {
    if (device?.mode === "primary") {
        speak(text);
    }
  }

  function announceCurrentScore() {
    if (!canScore) return;          // 🔒
    if (game.matchFinished) return

    const { teamA, teamB } = game.score

    speakIfPrimary(`Current score. Team A ${teamA}. Team B ${teamB}.`)
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

  function undoFromPopup() {
    if (!canScore) return;          // 🔒
    if (!confirmAction('Undo last point?')) return
    dispatch(undo())
    setSetPopup(null)   // 👈 CLOSE POPUP
  }

  function undoLast() {
        if (!canScore) return;          // 🔒
        if (!confirmAction('Undo last point?')) return
        dispatch(undo())
  }

  return (
    <div className="app-root">

      <main className="court">

        <LeftTeamPanel
          team="left"
          game={game}
          score={score}
          canScore={canScore}
          isServingPlayer={isServingPlayer}
        />

        <CenterPanel
            game={game}
            canScore={canScore}
            undo={undoLast}
            announceScore={announceCurrentScore}
            manualSync={() =>
                manualTwoWaySync(device?.mode, getDeviceId(), dispatch)
            }
            pause={() => dispatch(pauseMatch())}
            resume={() => dispatch(resumeMatch())}
            deviceMode={device?.mode}
        />

        <RightTeamPanel
          team="right"
          game={game}
          score={score}
          canScore={canScore}
          isServingPlayer={isServingPlayer}
        />

        {setPopup && (
            <SetPopup
                result={setPopup}
                game={game}
                canScore={canScore}
                deviceMode={device?.mode}
                onUndo={undoFromPopup}
                onAnnounce={announceMatchResult}
                onClose={() => setSetPopup(null)}
            />
        )}

      </main>
    </div>
  );
}