import { useEffect, useState } from "react";
import { db } from "../firebase";
import { doc, onSnapshot } from "firebase/firestore";

export default function ProjectorView() {
  const [game, setGame] = useState(null);

  useEffect(() => {
    const matchRef = doc(db, "matches", "liveMatch");

    const unsub = onSnapshot(matchRef, (snap) => {
      if (snap.exists()) {
        setGame(snap.data().gameState);
      }
    });

    return () => unsub();
  }, []);

  if (!game) return <h2>Waiting for match...</h2>;

  return (
    <div className="projector-screen">
      <h1>{game.teamInfo.teamA} {game.score.teamA}</h1>
      <h1>{game.teamInfo.teamB} {game.score.teamB}</h1>
    </div>
  );
}
