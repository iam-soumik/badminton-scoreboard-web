import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, doc, getDoc, onSnapshot } from "firebase/firestore";
import { useDispatch } from "react-redux";
import { loadPrematch, reset, setFirstServerTeam, startMatch, swapTeams } from "../redux/gameSlice";
import { getActiveTournamentRound, getSelectableMatches } from "../utils/utility";

export default function PrematchPanel({ game }) {

  const dispatch = useDispatch();
  const [matches, setMatches] = useState([]);
  const [results, setResults] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingResults, setLoadingResults] = useState(true);
  const [loadingTeams, setLoadingTeams] = useState(true);

  useEffect(() => {
    const unsubscribeMatches = onSnapshot(collection(db, "tournamentMatches"), matchSnap => {
      setMatches(matchSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoadingMatches(false);
    }, error => {
      console.error("Failed to load tournament matches:", error);
      setLoadingMatches(false);
    });

    const unsubscribeResults = onSnapshot(collection(db, "matchResults"), resultSnap => {
      setResults(resultSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoadingResults(false);
    }, error => {
      console.error("Failed to load match results:", error);
      setLoadingResults(false);
    });

    const unsubscribeTeams = onSnapshot(collection(db, "teams"), teamSnap => {
      setTeams(teamSnap.docs.map(d => ({
        id: d.id,
        ...d.data()
      })));
      setLoadingTeams(false);
    }, error => {
      console.error("Failed to load teams:", error);
      setLoadingTeams(false);
    });

    return () => {
      unsubscribeMatches();
      unsubscribeResults();
      unsubscribeTeams();
    };
  }, []);

  const loadingTournamentData = loadingMatches || loadingResults || loadingTeams;
  const selectableMatches = getSelectableMatches(matches, results, teams);
  const activeRound = getActiveTournamentRound(matches, results);
  const selectedMatchIsSelectable = selectableMatches.some(
    match => match.id === game.prematch.matchId
  );
  const tournamentCompleted = !loadingTournamentData && matches.length > 0 && !activeRound;
  const activeRoundBlocked = !loadingTournamentData && Boolean(activeRound) && selectableMatches.length === 0;

  useEffect(() => {
    if (game.matchStatus !== "idle") return;
    if (!game.prematch.matchId) return;
    if (loadingTournamentData) return;
    if (selectedMatchIsSelectable) return;

    dispatch(reset());
  }, [
    dispatch,
    game.matchStatus,
    game.prematch.matchId,
    loadingTournamentData,
    selectedMatchIsSelectable,
  ]);

  const handleSelect = async (matchId) => {
    if (!matchId) return;
    const match = selectableMatches.find(m => m.id === matchId);
    if (!match) return;

    const confirmLoad = window.confirm(
      "Load this match? Current setup will be replaced."
    );
    if (!confirmLoad) return;
    
    const snap = await getDoc(doc(db, "tournamentMatches", matchId));
    if (!snap.exists()) return;
    const data = snap.data();

    // load team documents
    const teamASnap = await getDoc(doc(db,"teams",data.teamAId));
    const teamBSnap = await getDoc(doc(db,"teams",data.teamBId));
    if (!teamASnap.exists() || !teamBSnap.exists()) return;

    const teamAData = teamASnap.data();
    const teamBData = teamBSnap.data();

    dispatch(loadPrematch({
      matchId,
      tournamentMatchId: matchId,
      matchLabel: data.label,
      round: data.round,
      teamAId: data.teamAId,
      teamBId: data.teamBId,

      teamA: {
        name: teamAData.teamName,
        players: teamAData.players
      },
      teamB: {
        name: teamBData.teamName,
        players: teamBData.players
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
              value={selectedMatchIsSelectable ? game.prematch.matchId : ""}
              onChange={(e) => handleSelect(e.target.value)}
              disabled={loadingTournamentData || selectableMatches.length === 0}
            >
              <option value="">
                {loadingTournamentData ? "Loading matches..." : "-- Select Match --"}
              </option>
              {selectableMatches.map(m => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
            {!loadingTournamentData && matches.length === 0 && (
              <div className="round-info">No tournament matches generated.</div>
            )}
            {tournamentCompleted && (
              <div className="round-info">Tournament completed - no pending matches.</div>
            )}
            {activeRoundBlocked && (
              <div className="round-info">Current round has no ready matches.</div>
            )}

            <div className="service-selection">
              <h4>First Serve</h4>

              <label>Serving Team</label>
              <select
                value={game.matchConfig.firstServerTeam}
                onChange={(e) =>
                  dispatch(setFirstServerTeam(e.target.value))
                }
              >
                <option value="teamA">
                  {game.players.teamA.map(p => p.name).join(" / ")}
                </option>
                <option value="teamB">
                  {game.players.teamB.map(p => p.name).join(" / ")}
                </option>
              </select>
            </div>
  
          </>
        )}
        {selectedMatchIsSelectable && (
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
