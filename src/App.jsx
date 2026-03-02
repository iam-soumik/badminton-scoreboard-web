import { useState, useEffect } from "react";
import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { buildSystemName, getDeviceId, getDeviceInfo } from "./utils/device";
import { useDeviceStatus } from "./redux/hooks/useDeviceStatus";
import ScoreboardScreen from "./pages/ScoreboardScreen";
import ProjectorView from "./pages/ProjectorView";
import MainMenu from "./pages/MainMenu";
import AdminPanel from "./pages/AdminPanel";
import BackButton from "./components/BackButton";
import TopBar from "./components/TopBar";

export default function App() {

  const [screen, setScreen] = useState(() => {
    return localStorage.getItem("currentScreen") || "menu";
  });
  const device = useDeviceStatus();

  /* ✅ 1️⃣ Device Register (Runs once) */
  useEffect(() => {
    const deviceId = getDeviceId();
    const deviceRef = doc(db, "devices", deviceId);

    const registerDevice = async () => {
      const info = await getDeviceInfo();
      const systemName = buildSystemName(info);

      await setDoc(
        deviceRef,
        {
          deviceId,
          role: "admin",
          mode: "standby",
          systemName,
          nickName: "",
          createdAt: serverTimestamp(),
          lastHeartbeat: serverTimestamp(),
        },
        { merge: true }
      );

      console.log("✅ Device registered:", deviceId);
    };

    registerDevice();
  }, []);

  /* Used for current active screen restorartion even after page reload */
  useEffect(() => {
    localStorage.setItem("currentScreen", screen);
  }, [screen]);


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