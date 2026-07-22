import LeftTeamPanel from "./LeftTeamPanel";
import RightTeamPanel from "./RightTeamPanel";
import CenterPanel from "./CenterPanel";
import SetPopup from "./SetPopup";
import { useEffect, useState } from "react";
import { formatDuration } from "../utils/utility";


export default function ScoreboardLayout({
  game,
  device,
  canScore,
  score,
  undo,
  announceScore,
  pause,
  resume,
  manualSync,
  isServingPlayer,
  setPopup,
  announceMatchResult,
  onSwap,   
  onSetPopupClose,
  onStartNewMatch,
  readOnly = false,
  setShowHistory,
}) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    if (game.matchStatus !== "live") return;

    const interval = setInterval(() => {
      setTime(Date.now());
    }, 1000);

    return () => clearInterval(interval);
  }, [game.matchStatus]);

  const durationEnd = game.matchTiming.endTime || time;
  const elapsed = formatDuration(game.matchTiming.startTime && durationEnd
    ? Math.max(0, Math.floor((durationEnd - game.matchTiming.startTime) / 1000))
    : 0);

  const serverName = game.teamInfo[game.server.team];

  return (
    <main className={`court ${game.matchFinished ? 'match-finished' : ''}`}>
        {
            game.matchStatus === "live" && (
            <div className="live-indicator">
                ● LIVE
            </div>
        )}

      <div className="scoreboard-main-grid">
        <LeftTeamPanel
          game={game}
          score={readOnly ? () => {} : score}
          canScore={!readOnly && canScore}
          isServingPlayer={isServingPlayer}
          onSwap={onSwap}
        />

        <CenterPanel
          game={game}
          canScore={!readOnly && canScore}
          undo={undo}
          announceScore={announceScore}
          manualSync={manualSync}
          pause={pause}
          resume={resume}
          deviceMode={device?.mode}
          readOnly={readOnly}
          onStartNewMatch={onStartNewMatch}
          setShowHistory={setShowHistory}
        />

        <RightTeamPanel
          game={game}
          score={readOnly ? () => {} : score}
          canScore={!readOnly && canScore}
          isServingPlayer={isServingPlayer}
          onSwap={onSwap}
        />
      </div>

      <section className="scoreboard-info-strip" aria-label="Match information">
        <div className="info-strip-section game-server-section">
          <strong>Game {game.gameNumber}</strong>
          <span>Server: {serverName}</span>
        </div>
        <div className="info-strip-section duration-section">
          <strong>Match Duration</strong>
          <span>{elapsed}</span>
        </div>
        <div className="info-strip-section tip-section">
          <strong>Tip:</strong>
          <span>
            Use +1 buttons to add points. Match is played in Best of 3 games.
            Each game is first to 21, win by 2, capped at 30.
          </span>
        </div>
      </section>

      {/* Popup only for scoring screen */}
      {!readOnly && setPopup && (
        <SetPopup
          result={setPopup}
          game={game}
          canScore={canScore}
          deviceMode={device?.mode}
          onUndo={undo}
          onAnnounce={announceMatchResult}
          onClose={onSetPopupClose}
        />
      )}

    </main>
  );
}
