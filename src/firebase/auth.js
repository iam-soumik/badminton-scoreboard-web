import { getAuth } from "firebase/auth";
import { app } from "./firebase";   // make sure your firebase.js exports app

export const auth = getAuth(app);