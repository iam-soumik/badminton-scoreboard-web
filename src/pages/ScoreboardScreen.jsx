import { useDispatch, useSelector } from 'react-redux';
import { addPoint, loadFullState, pauseMatch, reset, resumeMatch, startNewMatch, swapPlayers, undo } from '../redux/gameSlice';
import { useEffect, useState, useRef } from 'react';
import { speak } from '../utils/speak';
import { store } from '../redux/store';
import { getDeviceId } from "../utils/device";
import { pushMatchState } from "../firebase/matchSync";

import CenterPanel from '../components/CenterPanel';
import LeftTeamPanel from '../components/LeftTeamPanel';
import RightTeamPanel from '../components/RightTeamPanel';
import SetPopup from '../components/SetPopup';
import { manualTwoWaySync } from '../utils/syncMatchManually'
import { doc, updateDoc, serverTimestamp, getDoc, setDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import confirmAction from '../utils/utility';
import ScoreboardLayout from "../components/ScoreboardLayout";
import { clearLastSetResult } from '../redux/gameSlice';

export default function ScoreboardScreen({ device }) {

  const dispatch = useDispatch();
  const game = useSelector(state => state.game);

  const [setPopup, setSetPopup] = useState(null);
  const [hydrated, setHydrated] = useState(false);
  const prevServerRef = useRef(game.server);

  const canScore =
    device?.mode === "primary" ||
    device?.mode === "active";

  useEffect(() => {
    prevServerRef.current = game.server;
  }, [game.server]);

  
  /* 🔥 Primary Auto Push to Firestore (ONLY LIVE) */
  useEffect(() => {
    if (!hydrated) return;   
    if (device?.mode !== "primary") return;
    if (game.matchStatus !== "live") return;

    pushMatchState(game, getDeviceId());

  }, [game.revision, device?.mode, game.matchStatus]);

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
      `Set won by ${getTeamDisplayName(r.winner)}  ${winnerScore} ${loserScore}`
    )

  }, [game.lastSetResult])

  function score(courtSide) {
    if (!canScore) return;
    if (game.matchFinished) return;
    if (game.matchStatus !== "live") return;   // 🔥 block scoring

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

  /* Auto refresh current state from firestore even after manual browser reload. */
  useEffect(() => {

    const restoreMatch = async () => {
        const ref = doc(db, "matches", "live");
        const snap = await getDoc(ref);

        if (snap.exists()) {
          const data = snap.data();
          if (data.gameState && data.gameState.matchStatus !== "finished") {
              dispatch(loadFullState(data.gameState));
              console.log("🔁 Restored match state - data.gameState :-- ",data.gameState);
          } else {
            console.log("No active match. Showing prematch.");
            dispatch(reset());   // go to prematch screen
          }
        }

        setHydrated(true);  // 🔥 IMPORTANT
    };

    restoreMatch();

  }, []);

  /* This will push match result to Firestore */
  useEffect(() => {
    if (!game.matchFinished) return;

    const saveMatchResult = async () => {
      const matchRef = doc(
        db,
        "matchResults",
        `match_${game.tournamentMatchNumber}`
      );

      const winner =
        game.gamesWon.teamA > game.gamesWon.teamB ? "teamA" : "teamB";

      await setDoc(matchRef, {
        matchNumber: game.tournamentMatchNumber,
        matchLabel: game.prematch.matchLabel,
        teamAName: game.teamInfo.teamA,
        teamBName: game.teamInfo.teamB,
        round: game.prematch.matchLabel.replace(/[0-9]/g,''), // PQF1 → PQF
        gamesWon: game.gamesWon,
        setResults: game.setResults,
        winner: game.teamInfo[winner],
        createdAt: serverTimestamp(),
      });
      console.log("✅ Match result saved");
    };

    saveMatchResult();
  }, [game.matchFinished]);

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
    if (!canScore) return;
    if (game.matchFinished) return;

    const serverTeam = game.server.team;
    const opponent = serverTeam === "teamA" ? "teamB" : "teamA";

    const serverScore = game.score[serverTeam];
    const opponentScore = game.score[opponent];

    const serverName = getTeamDisplayName(serverTeam);
    const opponentName = getTeamDisplayName(opponent);

    speakIfPrimary(
      `Current score. ${serverName} ${serverScore}. ${opponentName} ${opponentScore}.`
    );
  }

  function announceMatchResult() {
    if (device?.mode !== "primary") return;   // 🔒 ONLY PRIMARY

    const winner = game.gamesWon.teamA === 2 ? 'teamA' : 'teamB'
    const loser  = winner === 'teamA' ? 'teamB' : 'teamA'

    const winnerName = getTeamDisplayName(winner);
    const loserName = getTeamDisplayName(loser);

    const winnerScore = game.gamesWon[winner]
    const loserScore = game.gamesWon[loser]

    speakIfPrimary(
      `${winnerName} wins the match by ${winnerScore} to ${loserScore}`
    )
  }

  function getTeamDisplayName(teamKey) {
    const players = game.players[teamKey];
    return players.map(p => p.name).join(" and ");
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

  function handleSwap(team) {
    dispatch(swapPlayers(team));
  }

  function handleSetPopupClose() {
    setSetPopup(null);
    dispatch(clearLastSetResult());
  }

  async function handleStartNewMatch() {
    // reset local scoring engine
    dispatch(startNewMatch());
  }

  if (!hydrated) {
    return <div>Restoring match...</div>
  }

  return (
    <div className="app-root">
      
        <ScoreboardLayout
          game={game}
          device={device}
          canScore={canScore}
          score={score}
          undo={undoLast}
          announceScore={announceCurrentScore}
          pause={() => dispatch(pauseMatch())}
          resume={() => dispatch(resumeMatch())}
          manualSync={() =>
              manualTwoWaySync(device?.mode, getDeviceId(), dispatch)
          }
          isServingPlayer={isServingPlayer}
          setPopup={setPopup}
          setSetPopup={setSetPopup}
          announceMatchResult={announceMatchResult}
          readOnly={false}
          onSwap={handleSwap}
          onSetPopupClose={handleSetPopupClose}
          onStartNewMatch={handleStartNewMatch}
        />

    </div>
  );
}