import { doc, getDoc, setDoc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase";
import { store } from "../redux/store";
import { loadFullState } from "../redux/gameSlice";

export async function manualTwoWaySync(deviceId, dispatch) {
  const matchRef = doc(db, "matches", "liveMatch");

  // 1️⃣ Get Local State
  const localGame = store.getState().game;
  const localRevision = localGame.revision || 0;

  // 2️⃣ Get Server State
  const snap = await getDoc(matchRef);

  if (!snap.exists()) {
    // No match exists → upload local
    await setDoc(matchRef, {
      gameState: localGame,
      revision: localRevision,
      updatedAt: serverTimestamp(),
      updatedBy: deviceId,
    });

    alert("✅ Server was empty. Uploaded local match.");
    return;
  }

  const serverData = snap.data();
  const serverGame = serverData.gameState;
  const serverRevision = serverData.revision || 0;

  // 3️⃣ Compare revisions
  if (localRevision > serverRevision) {
    // 📤 Local ahead → Upload
    const ok = window.confirm(
        "Your device is ahead. Upload and overwrite server?"
    );
    if (!ok) return;
    await setDoc(matchRef, {
      gameState: localGame,
      revision: localRevision,
      updatedAt: serverTimestamp(),
      updatedBy: deviceId,
    });

    alert("📤 Local was ahead. Uploaded to server.");
  }

  else if (serverRevision > localRevision) {
    // 📥 Server ahead → Download
    dispatch(loadFullState(serverGame));

    alert("📥 Server was ahead. Downloaded to this device.");
  }

  else {
    alert("✅ Already synced. No action needed.");
  }
}
