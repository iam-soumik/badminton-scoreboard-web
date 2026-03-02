// src/firebase.js

import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyBsxysJqVUaLcXJtCaWloI2QgdHnmgHg_E",
  authDomain: "badminton-tournament-nasibpur.firebaseapp.com",
  projectId: "badminton-tournament-nasibpur",
  storageBucket: "badminton-tournament-nasibpur.firebasestorage.app",
  messagingSenderId: "892926096864",
  appId: "1:892926096864:web:1ff78d81a39555b4b06785"
};

export const app = initializeApp(firebaseConfig);

export const db = getFirestore(app);
