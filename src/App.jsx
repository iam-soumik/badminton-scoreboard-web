import { useState, useEffect } from "react";
import { db } from "./firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";
import { buildSystemName, getDeviceId, getDeviceInfo } from "./utils/device";
import { useDeviceStatus } from "./redux/hooks/useDeviceStatus";
import ScoreboardScreen from "./pages/ScoreboardScreen";
import ProjectorView from "./pages/ProjectorView";
import MainMenu from "./pages/MainMenu";
import AdminPanel from "./pages/AdminPanel";
import BackButton from "./components/BackButton";
import TopBar from "./components/TopBar";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase/auth";
import LoginScreen from "./pages/LoginScreen";
import ResultsScreen from "./pages/ResultsScreen";
import TeamRegistrationScreen from "./pages/TeamRegistrationScreen";
import MatchCreatorScreen from "./pages/MatchCreatorScreen";
import TournamentSetupScreen from "./pages/TournamentSetupScreen";

export default function App() {

  const [user, setUser] = useState(null);
  const [deviceReady, setDeviceReady] = useState(false);
  const [screen, setScreen] = useState(() => {
    return localStorage.getItem("currentScreen") || "menu";
  });
  const device = useDeviceStatus();

  /* ✅ Add auth listener */
  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
    });

    return () => unsub();
  }, []);

/* ✅ 1️⃣ Device Register (After Login Ready) */
useEffect(() => {

  if (!user) return;   // 🔥 IMPORTANT

  const deviceId = getDeviceId();
  const deviceRef = doc(db, "devices", deviceId);

  const registerDevice = async () => {
    const snap = await getDoc(deviceRef);

    // If device exists → just refresh heartbeat
    if (snap.exists()) {

      await setDoc(
        deviceRef,
        {
          lastHeartbeat: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("🔁 Device exists, keeping current mode");
      setDeviceReady(true);
      return;
    }

    // 🔥 If device doc missing (like after deletion)
    const info = await getDeviceInfo();
    const systemName = buildSystemName(info);

    await setDoc(deviceRef, {
      deviceId,
      userId: user.uid,
      role: "admin",
      mode: "primary", // auto primary for now
      systemName,
      nickName: "",
      createdAt: serverTimestamp(),
      lastHeartbeat: serverTimestamp(),
    });

    console.log("✅ Device recreated as PRIMARY");
    setDeviceReady(true); // 🔥 mark ready AFTER ensure doc exists
  };

  registerDevice();

}, [user]);  // 🔥 DEPEND ON USER

  /* Used for current active screen restorartion even after page reload */
  useEffect(() => {
    localStorage.setItem("currentScreen", screen);
  }, [screen]);

  if (!user) {
    return <LoginScreen />;
  }

  if (!deviceReady) {
    return <div style={{ padding: 40 }}>Initializing device...</div>;
  }

  /* 🧭 Navigation Controller */
  switch (screen) {

    case "scoreboard":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <ScoreboardScreen device={device} />
        </>
      );

    case "admin":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <AdminPanel />
        </>
      );

    case "projector":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <ProjectorView />
        </>
      );

    case "results":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <ResultsScreen />
        </>
      );

    case "teams":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <TeamRegistrationScreen />
        </>
      );

    case "create-match":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <MatchCreatorScreen />
        </>
      );

    case "tournament-setup":
      return (
        <>
          <TopBar showBack onBack={() => setScreen("menu")} />
          <TournamentSetupScreen />
        </>
      );

    default:
      return (
        <>
          <TopBar />
          <MainMenu navigate={setScreen} />
        </>
      );
  }
}