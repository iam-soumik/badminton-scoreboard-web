import { startNewMatch } from "../redux/gameSlice";
import PrematchPanel from "./PrematchPanel";

export default function CenterPanel({
  game,
  canScore,
  undo,
  announceScore,
  manualSync,
  pause,
  resume,
  deviceMode,
  onStartNewMatch,
  readOnly = false
}) {

  /* 🧮 Build Set Grid */
  const MAX_SETS = 3;

  const setGrid = Array.from({ length: MAX_SETS }, (_, i) => {
    const completed = game.setResults[i];

    if (completed) {
      return {
        teamA: completed.teamA,
        teamB: completed.teamB,
        status: "completed"
      };
    }

    if (i + 1 === game.gameNumber) {
      return {
        teamA: game.score.teamA,
        teamB: game.score.teamB,
        status: "current"
      };
    }

    return { teamA: "", teamB: "", status: "future" };
  });


  return (
    <div className="center-panel">

      {/* 🔧 PREMATCH SECTION */}
      { game.matchStatus === "idle" && (
        <PrematchPanel game={game} />
      )}

      {/* 🏆 SET GRID */}
      <div className="set-grid">

        <div className="cell header"></div>
        {setGrid.map((_, i) => (
          <div key={i} className="cell header">
            Set {i + 1}
          </div>
        ))}

        <div className="cell team-name">
          {game.players.teamA.map(p => p.name).join(" / ")}
        </div>
        {setGrid.map((s, i) => (
          <div key={i} className={`cell score ${s.status}`}>
            {s.teamA}
          </div>
        ))}

        <div className="cell team-name">
          {game.players.teamB.map(p => p.name).join(" / ")}
        </div>
        {setGrid.map((s, i) => (
          <div key={i} className={`cell score ${s.status}`}>
            {s.teamB}
          </div>
        ))}

      </div>

      {/* 🎛 UTILITY CONTROLS */}
      {!readOnly && (
        <div className="utility-div">

            <button className="utility-btn" disabled={!canScore} onClick={undo} >
              Undo
            </button>

            <button className="utility-btn" disabled={!canScore} onClick={announceScore} >
              Score
            </button>

            <button className="utility-btn"
              disabled={
                  deviceMode === "standby" ||
                  game.matchStatus !== "live"
              }
              onClick={manualSync}
            >
            🔄 Manual Sync
            </button>

            {game.matchStatus === "live" && (
            <button
                className="utility-btn"
                onClick={pause}
            >
                ⏸ Pause
            </button>
            )}

            {game.matchStatus === "paused" && (
            <button
                className="utility-btn"
                onClick={resume}
            >
                ▶ Resume
            </button>
            )}

            {game.matchFinished && (
              <button
                className="utility-btn"
                onClick={onStartNewMatch}
              >
                🆕 New Match
              </button>
            )}

        </div>
      )}

      {/* 📢 GAME INFO */}
      <div className="game-info">
        Game {game.gameNumber} • Server: {game.teamInfo[game.server.team]}
      </div>

    </div>
  );
}