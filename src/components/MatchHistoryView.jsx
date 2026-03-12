import { useState } from "react";
import MiniCourt from "./MiniCourt";

export default function MatchHistoryView({ game, onClose, isPopup }) {

    const history = game.history || [];

    /* Build full timeline including current state */
    const timeline = [
    {
        score: { teamA: 0, teamB: 0 },
        players: history[0]?.players || game.players,
        server: history[0]?.server || game.server,
        courtSides: history[0]?.courtSides || game.courtSides,
        gameNumber: 1
    },
    ...history,
    {
        score: game.score,
        players: game.players,
        server: game.server,
        courtSides: game.courtSides,
        gameNumber: game.gameNumber
    }
    ];

    console.log("timeline ->  ",timeline);
    const rallies = timeline.slice(1).map((snapshot, i) => ({
        snapshot,
        index: i
    }));
    const [selectedSet,setSelectedSet] = useState("all");

  /* Group rallies by set */
    const sets = {};

    rallies.forEach((r) => {

        const set = r.snapshot.gameNumber || 1;

        if (!sets[set]) sets[set] = [];

        sets[set].push(r);

    });

    let ralliesToShow = [];

    if (selectedSet === "all") {
        ralliesToShow = rallies;
    } else {
        ralliesToShow = sets[selectedSet] || [];
    }

  function getServer(snapshot){
    const team = snapshot.server.team;
    const idx = snapshot.server.playerIndex;
    const player = snapshot.players[team][idx];
    return {
        name: player.name,
        side: player.court,
        team
    };
 }

  function getReceiver(snapshot){

    const servingTeam = snapshot.server.team;
    const receivingTeam = servingTeam === "teamA" ? "teamB" : "teamA";

    const server = getServer(snapshot);

    const receiver = snapshot.players[receivingTeam]
        .find(p => p.court === server.side);

    return {
        name: receiver?.name,
        side: server.side,
        team: receivingTeam
    };

  }

  return (
    <div className={isPopup ? "history-popup-wrapper" : "history-screen-wrapper"}>
      <div className="history-container">
        {onClose && (
          <button className="history-close" onClick={onClose}>✕</button>
        )}
        <h2 className="history-title">Match History</h2>
        <div className="set-filter">
            <button className={selectedSet==="all"?"active":""} onClick={()=>setSelectedSet("all")} >
                All Sets
            </button>
            {Object.keys(sets).map(set => (
                <button key={set} className={selectedSet==set?"active":""} onClick={()=>setSelectedSet(set)}>
                    Set {set}
                </button>
            ))}
        </div>

        <div className="history-table">
          <div className="history-header">
            <span>#</span>
            <span>Score</span>
            <span>Server</span>
            <span>Receiver</span>
            <span>Winner</span>
            <span>Court</span>
          </div>

          <div className="history-body">
            {
                 ralliesToShow.map((item, localIndex)=>{

                const h = item.snapshot;

                const server = getServer(h);
                const receiver = getReceiver(h);

                const a = h.score.teamA;
                const b = h.score.teamB;

                let winner = null;

                const prev = timeline[item.index];

                if (a > prev.score.teamA) winner = "teamA";
                if (b > prev.score.teamB) winner = "teamB";

                const winnerName = winner ? game.teamInfo[winner] : "";
                const winnerClass = winner === "teamA" ? "teamA" : "teamB";

                return (
                    <div
                    key={`set${h.gameNumber}-rally${localIndex}`}
                    className="history-row"
                    >

                    <span>{localIndex + 1}</span>

                    <span className="score-history">
                        {a}-{b}
                    </span>

                    <span className="server">
                        {server.name} ({server.side === "RIGHT" ? "R" : "L"})
                    </span>

                    <span className="receiver">
                        {receiver.name} ({receiver.side === "RIGHT" ? "R" : "L"})
                    </span>

                    <span className={`winner ${winnerClass}`}>
                        {winnerName}
                    </span>

                    <span>
                        <MiniCourt
                        snapshot={h}
                        serverSide={server.side}
                        serverName={server.name}
                        receiverName={receiver.name}
                        />
                    </span>

                    </div>
                );
                })  
            }
          </div>
        </div>
      </div>
    </div>
  );
}