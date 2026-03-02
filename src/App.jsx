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

export default function App() {

  const [user, setUser] = useState(null);
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

  /* ✅ 1️⃣ Device Register (Runs once) */
  useEffect(() => {
    const deviceId = getDeviceId();
    const deviceRef = doc(db, "devices", deviceId);

    const registerDevice = async () => {
      const snap = await getDoc(deviceRef);

      // If device already exists → DO NOT override mode
      if (snap.exists()) {
        await setDoc(
          deviceRef,
          {
            lastHeartbeat: serverTimestamp(),
          },
          { merge: true }
        );

        console.log("🔁 Device exists, not overriding mode");
        return;
      }

      // Only create if first time
      const info = await getDeviceInfo();
      const systemName = buildSystemName(info);

      await setDoc(deviceRef, {
        deviceId,
        userId: user.uid,
        role: "admin",
        //mode: "standby",
        mode: "primary",   // 🔥 auto primary
        systemName,
        nickName: "",
        createdAt: serverTimestamp(),
        lastHeartbeat: serverTimestamp(),
      });

      console.log("✅ New device registered");
    };

    registerDevice();
  }, []);

  /* Used for current active screen restorartion even after page reload */
  useEffect(() => {
    localStorage.setItem("currentScreen", screen);
  }, [screen]);

  if (!user) {
    return <LoginScreen />;
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

    default:
      return (
        <>
          <TopBar />
          <MainMenu navigate={setScreen} />
        </>
      );
  }
}