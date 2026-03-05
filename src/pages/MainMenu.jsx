import { useDeviceStatus } from "../redux/hooks/useDeviceStatus";

export default function MainMenu({ navigate }) {

  const device = useDeviceStatus();

  return (
    <div className="menu-container">

      <div className="menu-card">

        <h1 className="menu-title">
          🏸 NASIBPUR BRAHMINPARA
        </h1>

        <p className="menu-subtitle">
          Badminton Tournament Control System
        </p>

        <div className="menu-buttons">

          <button
            className="menu-btn primary"
            onClick={() => navigate("scoreboard")}
          >
            ▶ Start Scoreboard
          </button>

          <button
            className="menu-btn admin"
            onClick={() => navigate("admin")}
          >
            ⚙ Admin Panel
          </button>

          <button
            className="menu-btn projector"
            onClick={() => navigate("projector")}
          >
            📽 Projector Display
          </button>

          <button
            className="menu-btn results"
            onClick={() => navigate("results")}
          >
            📊 Match Results
          </button>

        </div>

        <div className="menu-device-info">
          <span className={`mode-badge ${device?.mode}`}>
            {device?.mode?.toUpperCase()}
          </span>

          <span className={`role-badge ${device?.role}`}>
            {device?.role?.toUpperCase()}
          </span>
        </div>

      </div>

    </div>
  );
}