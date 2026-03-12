export default function MiniCourt({ snapshot, serverSide, serverName, receiverName }) {

  const { courtSides, players } = snapshot;

  const leftTeam = courtSides.left;
  const rightTeam = courtSides.right;

  const leftPlayers = players[leftTeam];
  const rightPlayers = players[rightTeam];

  const getPlayer = (teamPlayers, side) =>
    teamPlayers.find(p => p.court === side)?.name || "";

  const renderCell = (playerName, side) => {

    let className = "court-cell";
    const isServer =
    playerName?.trim().toLowerCase() === serverName?.trim().toLowerCase() &&
    side === serverSide;

  const isReceiver =
    playerName?.trim().toLowerCase() === receiverName?.trim().toLowerCase() &&
    side === serverSide;

    if (isServer) className += " server-cell";
    if (isReceiver) className += " receiver-cell";

    return (
      <div className={className}>
        {playerName}
      </div>
    );
  };

  return (

    <div className="mini-court">

      {/* LEFT TEAM */}

      <div className="court-team">

        {renderCell(getPlayer(leftPlayers,"LEFT"),"LEFT")}
        {renderCell(getPlayer(leftPlayers,"RIGHT"),"RIGHT")}

      </div>

      <div className="court-divider"/>

      {/* RIGHT TEAM (mirrored) */}

      <div className="court-team">

        {renderCell(getPlayer(rightPlayers,"RIGHT"),"RIGHT")}
        {renderCell(getPlayer(rightPlayers,"LEFT"),"LEFT")}

      </div>

    </div>

  );
}