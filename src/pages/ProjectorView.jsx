import { useEffect, useState, useRef } from "react";
import { db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import ScoreboardLayout from "../components/ScoreboardLayout";

export default function ProjectorView() {

  const [game, setGame] = useState(null);
  const lastRevisionRef = useRef(null);

  useEffect(() => {
    const matchRef = doc(db, "matches", "live");

    let interval;

    const checkRevision = async () => {
      try {
        const snap = await getDoc(matchRef);
        if (!snap.exists()) return;

        const data = snap.data();
        const serverRevision = data.revision || 0;

        if (serverRevision !== lastRevisionRef.current) {
          lastRevisionRef.current = serverRevision;
          setGame(data.gameState);

          if (data.gameState?.matchStatus === "finished") {
            clearInterval(interval);
          }
        }

      } catch (err) {
        console.error("Projector fetch failed:", err);
      }
    };

    checkRevision();
    interval = setInterval(checkRevision, 4000);

    return () => clearInterval(interval);

  }, []);

  if (!game) {
    return (
      <div style={{ textAlign: "center", padding: "50px" }}>
        Waiting for match...
      </div>
    );
  }

  return (
    <div className="app-root">
      <ScoreboardLayout
        game={game}
        device={{ mode: "projector" }}
        canScore={false}
        isServingPlayer={(team, player) =>
          game.server.team === team &&
          game.players[team][game.server.playerIndex]?.name === player.name
        }
        readOnly={true}
      />
    </div>
  );
}