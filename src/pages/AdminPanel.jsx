import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, doc, updateDoc, getDocs } from "firebase/firestore";

function AdminPanel() {
  const [devices, setDevices] = useState([]);
  const [now, setNow] = useState(Date.now());
  const [editingId, setEditingId] = useState(null);
  const [tempNick, setTempNick] = useState("");

  useEffect(() => {

    // ✅ Function to load devices ONCE
    const loadDevices = async () => {
      try {
        const snap = await getDocs(collection(db, "devices"));

        const list = snap.docs.map(docSnap => ({
          id: docSnap.id,
          ...docSnap.data(),
        }));

        setDevices(list);

      } catch (err) {
        console.error("Failed to fetch devices:", err);
      }
    };

    // 🔥 Load immediately when AdminPanel opens
    loadDevices();

    // 🔁 Poll every 10 seconds instead of realtime streaming
    const interval = setInterval(loadDevices, 10000);

    // Cleanup when leaving page
    return () => clearInterval(interval);

  }, []);


  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Date.now());
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const isOnline = (lastHeartbeat) => {
    if (!lastHeartbeat) return true; // treat pending write as online

    const last = lastHeartbeat.toDate().getTime();
    return now - last < 120000; // 2 minutes
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

  const getDisplayName = (device) => {
    if (device.nickName && device.nickName.trim() !== "") {
      return (
        <>
          <strong>{device.nickName}</strong>
          <div style={{ fontSize: 12, opacity: 0.7 }}>
            {device.systemName}
          </div>
        </>
      );
    }

    return <strong>{device.systemName}</strong>;
  };

  const startEditNick = (device) => {
    setEditingId(device.id);
    setTempNick(device.nickName || "");
  };

  const cancelEditNick = () => {
    setEditingId(null);
    setTempNick("");
  };

  const saveNickName = async (deviceId) => {
    await updateDoc(doc(db, "devices", deviceId), {
      nickName: tempNick,
    });

    setEditingId(null);
    setTempNick("");
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin Device Monitor</h2>

      <table border="1" cellPadding="10">
        <thead>
          <tr>
            <th>Device Info</th>
            <th>Status</th>
            <th>Role Control</th>
            <th>Mode Control</th>
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id}>
              <td>
                <div style={{ marginTop: 6 }}>
                  
                    {editingId !== device.id ? (
                      <>
                        <div style={{ fontWeight: "bold" }}>
                          {device.nickName || "— No Nickname —"}
                        </div>

                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {device.systemName}
                        </div>

                        <button onClick={() => startEditNick(device)}>
                          ✏️ Edit
                        </button>
                      </>
                    ) : (
                      <>
                        <input
                          value={tempNick}
                          onChange={(e) => setTempNick(e.target.value)}
                        />

                        <button onClick={() => saveNickName(device.id)}>Save</button>
                        <button onClick={cancelEditNick}>Cancel</button>
                      </>
                    )}
                  
                </div>
              </td>

              <td>
                {isOnline(device.lastHeartbeat)
                  ? "🟢 Online"
                  : "🔴 Offline"}
              </td>

              <td>
                <span className={`role-badge ${device.role}`}>
                  {device.role.toUpperCase()}
                </span>
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
              
              
              <td>
                <span className={`mode-badge ${device.mode}`}>
                  {device.mode.toUpperCase()}
                </span>
                <div style={{ marginTop: 6 }}>
                  <button onClick={() => setPrimary(device.id)}>
                    Set Primary
                  </button>
                  <button onClick={() => setActive(device.id)}>
                    Set Active
                  </button>
                  <button onClick={() => setStandby(device.id)}>
                    Set Standby
                  </button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
