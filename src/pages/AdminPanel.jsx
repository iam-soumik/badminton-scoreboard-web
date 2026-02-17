import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot, doc, updateDoc, getDocs } from "firebase/firestore";

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "devices"),
      (snapshot) => {
        const list = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setDevices(list);
      }
    );

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now()); // force re-render every 1 second
    }, 1000);

    return () => clearInterval(interval);
  }, []);


  const isOnline = (lastHeartbeat) => {
    if (!lastHeartbeat) return true; // treat pending write as online

    const last = lastHeartbeat.toDate().getTime();
    return now - last < 20000;
  };

  const setPrimary = async (deviceId) => {
    const snapshot = await getDocs(collection(db, "devices"));

    // Remove existing primary safely
    for (const docSnap of snapshot.docs) {
      if (docSnap.data().mode === "primary") {
        await updateDoc(doc(db, "devices", docSnap.id), {
          mode: "standby"
        });
      }
    }

    // Set selected device as primary
    await updateDoc(doc(db, "devices", deviceId), {
      mode: "primary"
    });
  };

  const setActive = async (deviceId) => {
    const snapshot = await getDocs(collection(db, "devices"));

    let activeCount = 0;

    snapshot.forEach(docSnap => {
      if (docSnap.data().mode === "active" || docSnap.data().mode === "primary") {
        activeCount++;
      }
    });

    if (activeCount >= 2) {
      alert("Maximum 2 active devices allowed.");
      return;
    }

    await updateDoc(doc(db, "devices", deviceId), {
      mode: "active"
    });
  };

  const setStandby = async (deviceId) => {
    await updateDoc(doc(db, "devices", deviceId), {
      mode: "standby"
    });
  };

  const updateRole = async (deviceId, newRole) => {
    try {
      await updateDoc(doc(db, "devices", deviceId), {
        role: newRole
      });
    } catch (err) {
      console.error("Failed to update role", err);
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Device Monitor</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Device ID</th>
            <th>Role</th>
            <th>Mode</th>
            <th>Status</th>
            <th>Control</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id}>
              <td>{device.id}</td>
              <td>
                <strong>{device.role}</strong>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => updateRole(device.id, "admin")}>
                    Admin
                  </button>{" "}
                  <button onClick={() => updateRole(device.id, "referee")}>
                    Referee
                  </button>{" "}
                  <button onClick={() => updateRole(device.id, "helper")}>
                    Helper
                  </button>
                </div>
              </td>
              <td>{device.mode}</td>
              <td>
                {isOnline(device.lastHeartbeat)
                  ? "🟢 Online"
                  : "🔴 Offline"}
              </td>
              <td>
                <button onClick={() => setPrimary(device.id)}>
                  Set Primary
                </button>
                <button onClick={() => setActive(device.id)}>
                  Set Active
                </button>
                <button onClick={() => setStandby(device.id)}>
                  Set Standby
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
