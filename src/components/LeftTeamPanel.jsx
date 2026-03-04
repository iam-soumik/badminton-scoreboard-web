
export default function LeftTeamPanel({
  game,
  score,
  canScore,
  isServingPlayer,
  onSwap           
}) {

  // 🔁 Resolve logical team from visual left side
  const leftTeam = game.courtSides.left;
  const leftPlayers = game.players[leftTeam];

  return (
    <div className="team left">
      <div className="players-section">
        {/* Player 1 */}
        {leftPlayers[0] && (
          <div
            className={`
              player-badge
              court-${leftPlayers[0].court.toLowerCase()}
              ${isServingPlayer(leftTeam, leftPlayers[0])
                ? "serving-player"
                : "partner-player"}
            `}
          >
            {leftPlayers[0].name}
          </div>
        )}

        {/* 🔄 Swap Button Between Players */}
        {!game.started && !game.matchFinished && (
          <button
            className="swap-btn"
            onClick={() => onSwap(leftTeam)}
          >
            🔄 Swap
          </button>
        )}

        {/* Player 2 */}
        {leftPlayers[1] && (
          <div
            className={`
              player-badge
              court-${leftPlayers[1].court.toLowerCase()}
              ${isServingPlayer(leftTeam, leftPlayers[1])
                ? "serving-player"
                : "partner-player"}
            `}
          >
            {leftPlayers[1].name}
          </div>
        )}
      </div>
      <div className="team-footer">
        <div
          key={game.score[leftTeam]}
          className="team-score score-animate"
        >
          {game.score[leftTeam]}
        </div>

        <button
          className="score-btn"
          onClick={() => score("left")}
          disabled={
            game.matchFinished ||
            !canScore ||
            game.matchStatus !== "live"
          }
        >
          +1
        </button>
      </div>

    </div>
  );
}