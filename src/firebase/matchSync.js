import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export async function pushMatchState(game, deviceId) {
  const ref = doc(db, "matches", "live");

  await setDoc(
    ref,
    {
      gameState: game,
      revision: game.revision || 0,
      updatedAt: serverTimestamp(),
      updatedBy: deviceId,
    },
    { merge: true }
  );
}