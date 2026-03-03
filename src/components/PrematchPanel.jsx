import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { loadPrematch, startMatch, swapTeams } from "../redux/gameSlice";

export default function PrematchPanel({ game }) {

  const dispatch = useDispatch();
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const fetchMatches = async () => {
      const snap = await getDocs(collection(db, "tournamentMatches"));
      console.log("Match snapshot:", snap);
      const list = snap.docs.map(d => ({
        id: d.id,
        ...d.data()
      }));
      console.log("Match list:", list);
      setMatches(list);
    };

    fetchMatches();
  }, []);

  const handleSelect = async (matchId) => {

    if (!matchId) return;

    const confirmLoad = window.confirm(
      "Load this match? Current setup will be replaced."
    );

    if (!confirmLoad) return;

    const snap = await getDoc(doc(db, "tournamentMatches", matchId));

    if (!snap.exists()) return;

    const data = snap.data();

    dispatch(loadPrematch({
        matchId,
        matchLabel: data.label,
        teamA: {
            name: data.teamAName,
            players: data.teamAPlayers
        },
        teamB: {
            name: data.teamBName,
            players: data.teamBPlayers
        }
    }));
  };

  return (
    <>
      <div className="prematch-panel">
        <h2 className="prematch-title">Prematch Setup</h2>
        {game.matchStatus === "idle" && (
          <>
            <label>Select Match</label>
            <select
              value={game.prematch.matchId || ""}
              onChange={(e) => handleSelect(e.target.value)}
            >
              <option value="">-- Select Match --</option>
              {matches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </>
        )}
        {game.prematch.matchId && (
          <button
              style={{ marginTop: "12px" }}
              onClick={() => dispatch(startMatch())}
          >
              ▶ Start Match
          </button>
        )}

      </div>
      {game.matchStatus === "idle" && (
        <button 
            className="swapTeams-btn"
            onClick={() => dispatch(swapTeams())}>
          🔁 Swap Teams
        </button>
      )}
    </>
  );
}