export default function RightTeamPanel({
  game,
  score,
  canScore,
  isServingPlayer,
  onSwap           
}) {

  const rightTeam = game.courtSides.right;
  const rightPlayers = game.players[rightTeam];

  return (
    <div className="team right">
      <div className="players-section">
        {rightPlayers[0] && (
          <div
            key={rightPlayers[0].name}
            className={`
              player-badge
              court-${rightPlayers[0].court.toLowerCase()}
              ${isServingPlayer(rightTeam, rightPlayers[0])
                ? "serving-player"
                : "partner-player"}
            `}
          >
            {rightPlayers[0].name}
          </div>
        )}

        {/* 🔄 Swap Button (Only One) */}
        {game.score.teamA === 0 &&
          game.score.teamB === 0 &&
          !game.matchFinished && (
          <button
            className="swap-btn"
            onClick={() => onSwap(rightTeam)}
          >
            🔄 Swap
          </button>
        )}

        {rightPlayers[1] && (
            <div
              key={rightPlayers[1].name}
              className={`
                player-badge
                court-${rightPlayers[1].court.toLowerCase()}
                ${isServingPlayer(rightTeam, rightPlayers[1])
                  ? "serving-player"
                  : "partner-player"}
              `}
            >
              {rightPlayers[1].name}
            </div>
        )}
      </div>
      <div className="team-footer">
        <div
            key={game.score[rightTeam]}
            className="team-score score-animate">
                {game.score[rightTeam]}
        </div>

        <button
          className="score-btn"
          onClick={() => score("right")}
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