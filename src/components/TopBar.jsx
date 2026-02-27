import { useEffect, useState } from "react";

export default function TopBar({ showBack, onBack }) {

  const [time, setTime] = useState(new Date());

  /* ⏰ CLOCK */
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="top-bar">

      {/* LEFT SIDE */}
      <div className="top-left">
        {showBack && (
          <button className="top-back-btn" onClick={onBack}>
            ⬅
          </button>
        )}
      </div>

      {/* CENTER TITLE */}
      <div className="tournament-title">
        NASIBPUR BRAHMINPARA BADMINTON TOURNAMENT
      </div>

      {/* RIGHT SIDE CLOCK */}
      <div className="date-time">
        {time.toLocaleDateString()} • {time.toLocaleTimeString()}
      </div>

    </header>
  );
}