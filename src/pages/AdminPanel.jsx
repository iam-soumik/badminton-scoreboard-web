import { useEffect, useState } from "react";
import { db } from "../firebase";
import { collection, onSnapshot } from "firebase/firestore";
import { Timestamp } from 'firebase/firestore';

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
          </tr>
        </thead>
        <tbody>
          {devices.map(device => (
            <tr key={device.id}>
              <td>{device.id}</td>
              <td>{device.role}</td>
              <td>{device.mode}</td>
              <td>
                {isOnline(device.lastHeartbeat)
                  ? "🟢 Online"
                  : "🔴 Offline"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default AdminPanel;
