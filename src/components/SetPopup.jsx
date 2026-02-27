export default function SetPopup({
  result,
  game,
  canScore,
  deviceMode,
  onUndo,
  onAnnounce,
  onClose
}) {

  const winnerScore =
    result.winner === "teamA"
      ? result.teamA
      : result.teamB;

  const loserScore =
    result.winner === "teamA"
      ? result.teamB
      : result.teamA;

  return (
    <div className="set-popup">

      <div className="popup-card">

        <h2>SET RESULT</h2>

        <p>
          {game.teamInfo[result.winner]} won
        </p>

        <p>
          {winnerScore} - {loserScore}
        </p>

        <div className="popup-actions">

          <button
            disabled={!canScore}
            onClick={onUndo}
          >
            Undo
          </button>

          {game.matchFinished &&
            deviceMode === "primary" && (
              <button onClick={onAnnounce}>
                Announce
              </button>
          )}

          <button onClick={onClose}>
            OK
          </button>

        </div>

      </div>

    </div>
  );
}