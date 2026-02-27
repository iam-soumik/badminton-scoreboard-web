import { useEffect, useState, useRef } from "react";
import { db } from "../firebase";
import { doc, getDoc } from "firebase/firestore";

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

          // 🛑 Stop polling if match finished
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
    return <h2 style={{ textAlign: "center" }}>Waiting for match...</h2>;
  }

  return (
    <div className="projector-screen">
      <h1>{game.teamInfo.teamA} {game.score.teamA}</h1>
      <h1>{game.teamInfo.teamB} {game.score.teamB}</h1>
    </div>
  );
}