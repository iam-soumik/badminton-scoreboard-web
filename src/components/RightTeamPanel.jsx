export default function RightTeamPanel({
  game,
  score,
  canScore,
  isServingPlayer
}) {

  const rightTeam = game.courtSides.right;
  const rightPlayers = game.players[rightTeam];

  return (
    <div className="team right">

      {rightPlayers.map(player => (
        <div
          key={player.name}
          className={`
            player-badge
            court-${player.court.toLowerCase()}
            ${isServingPlayer(rightTeam, player)
              ? "serving-player"
              : "partner-player"}
          `}
        >
          {player.name}
        </div>
      ))}

      <div className="team-footer">
        <div className="team-score">
          {game.score[rightTeam]}
        </div>

        <button
          className="score-btn"
          onClick={() => score("right")}
          disabled={game.matchFinished || !canScore}
        >
          +1
        </button>
      </div>

    </div>
  );
}