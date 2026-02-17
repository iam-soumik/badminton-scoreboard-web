import { useEffect, useState } from "react";
import { db } from "../../firebase";
import { doc, onSnapshot } from "firebase/firestore";
import { getDeviceId } from "../../utils/device";

export function useDeviceStatus() {
  const [device, setDevice] = useState(null);

  useEffect(() => {
    const deviceId = getDeviceId();
    const ref = doc(db, "devices", deviceId);

    const unsub = onSnapshot(ref, snap => {
      if (snap.exists()) {
        setDevice(snap.data());
      }
    });

    return () => unsub();
  }, []);

  return device;
}
