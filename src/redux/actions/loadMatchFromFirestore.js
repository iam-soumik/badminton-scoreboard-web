import { db } from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import { setFullState } from "../gameSlice";

export async function fetchMatchState(dispatch) {
  const ref = doc(db, "matches", "live");

  const snap = await getDoc(ref);

  if (snap.exists()) {
    dispatch(setFullState(snap.data()));
  }
}
