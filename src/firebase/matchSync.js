import { db } from "../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function pushMatchState(game) {
  const ref = doc(db, "matches", "live");

  await setDoc(
    ref,
    {
      score: game.score,
      server: game.server,
      setResults: game.setResults,
      gameNumber: game.gameNumber,
      gamesWon: game.gamesWon,
      courtSides: game.courtSides,
      matchFinished: game.matchFinished,
      updatedAt: serverTimestamp(),
    },
    { merge: true }
  );
}
