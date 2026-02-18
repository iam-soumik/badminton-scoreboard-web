export async function syncMatchToServer(game, deviceId) {
    const matchRef = doc(db, "matches", "liveMatch");

    await setDoc(matchRef, {
      gameState: game,
      updatedAt: serverTimestamp(),
      updatedBy: deviceId,
    });
  }