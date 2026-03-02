import LeftTeamPanel from "./LeftTeamPanel";
import RightTeamPanel from "./RightTeamPanel";
import CenterPanel from "./CenterPanel";
import SetPopup from "./SetPopup";
import PrematchPanel from "./PrematchPanel";

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
  setSetPopup,
  announceMatchResult,
  readOnly = false,
}) {

  return (
    <main className={`court ${game.matchFinished ? 'match-finished' : ''}`}>
        {
            game.matchStatus === "live" && (
            <div className="live-indicator">
                ● LIVE
            </div>
        )}
      
      <LeftTeamPanel
        game={game}
        score={readOnly ? () => {} : score}
        canScore={!readOnly && canScore}
        isServingPlayer={isServingPlayer}
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
      />

      <RightTeamPanel
        game={game}
        score={readOnly ? () => {} : score}
        canScore={!readOnly && canScore}
        isServingPlayer={isServingPlayer}
      />

      {/* Popup only for scoring screen */}
      {!readOnly && setPopup && (
        <SetPopup
          result={setPopup}
          game={game}
          canScore={canScore}
          deviceMode={device?.mode}
          onUndo={undo}
          onAnnounce={announceMatchResult}
          onClose={() => setSetPopup(null)}
        />
      )}

    </main>
  );
}