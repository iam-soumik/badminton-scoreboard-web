export default function LeftTeamPanel({
  game,
  score,
  canScore,
  isServingPlayer
}) {

  // 🔁 Resolve logical team from visual left side
  const leftTeam = game.courtSides.left;
  const leftPlayers = game.players[leftTeam];

  return (
    <div className="team left">

      {leftPlayers.map(player => (
        <div
          key={player.name}
          className={`
            player-badge
            court-${player.court.toLowerCase()}
            ${isServingPlayer(leftTeam, player)
              ? "serving-player"
              : "partner-player"}
          `}
        >
          {player.name}
        </div>
      ))}

      <div className="team-footer">
        <div
            key={game.score[leftTeam]}
            className="team-score score-animate">
            {game.score[leftTeam]}
        </div>

        <button
          className="score-btn"
          onClick={() => score("left")}
          disabled={game.matchFinished || !canScore}
        >
          +1
        </button>
      </div>

    </div>
  );
}