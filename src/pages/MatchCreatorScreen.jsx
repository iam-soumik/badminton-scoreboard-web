import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { getMatchLabels } from '../utils/utility';
import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  serverTimestamp,
  getDoc
} from "firebase/firestore";

export default function MatchCreatorScreen() {

  const [teams,setTeams] = useState([]);
  const [matches,setMatches] = useState([]);

  const [round,setRound] = useState("QF");
  const [matchLabel,setMatchLabel] = useState("Select Match");
  const [teamA,setTeamA] = useState("Select Team");
  const [teamB,setTeamB] = useState("Select Team");
  const [editingMatchId,setEditingMatchId] = useState(null);
  const [tournament,setTournament] = useState(null);
  const [openRound, setOpenRound] = useState(null);
  const [teamMap,setTeamMap] = useState({});

  const ROUND_ORDER = ["SUPER32","PREQF","QF","SF","F"];
  const isSelected = matches.filter(m => m.round === round).flatMap(m => [m.teamAId, m.teamBId]);
  
  const exists = matches.some( m =>
        m.round === round &&
        m.label.toUpperCase() === matchLabel.toUpperCase() &&
        m.id !== editingMatchId
  );

  const availableRounds = tournament
  ? ROUND_ORDER.slice(ROUND_ORDER.indexOf(tournament.firstRound))
  : [];

  const matchLabels = getMatchLabels(round);

  useEffect(()=>{
    loadTournament()
  },[]);

  useEffect(()=>{
    loadAllTeams();
  },[]);

  useEffect(()=>{
    //loadTeams();
    loadMatches();
  },[]);

  useEffect(()=>{
    loadTeamsForRound(round)
  },[round,tournament]);

  useEffect(() => {
    setOpenRound(round);
  }, [round]);

  useEffect(() => {
    if (teams.length > 0) {
      if (!teamA) {
        setTeamA(teams[0].id);
      }
      if (!teamB && teams.length > 1) {
        setTeamB(teams[1].id);
      }
    }
  }, [teams]);

  useEffect(() => {
    const labels = getMatchLabels(round);

    if (!matchLabel && labels.length > 0) {
      setMatchLabel(labels[0]);
    }

  }, [round]);

  function resetForm(){
    setMatchLabel("");
    setTeamA("");
    setTeamB("");
  }

  async function loadTournament(){
    const snap = await getDoc(doc(db,"tournamentConfig","current"));
    if(!snap.exists()) return;
    setTournament(snap.data());
  }

  async function loadAllTeams() {
    const snap = await getDocs(collection(db,"teams"));

    const list = snap.docs.map(d => ({
      id:d.id,
      ...d.data()
    }));

    setTeams(list);     // dropdown teams
    //setAllTeams(list);  // optional if still used

    const map = {};
    list.forEach(t => {
      map[t.id] = t.teamName;
    });

    setTeamMap(map);
  }

  function startEdit(match){
    setEditingMatchId(match.id)
    setRound(match.round)
    setMatchLabel(match.label)
    setTeamA(match.teamAId)
    setTeamB(match.teamBId)
  }

  async function loadTeamsForRound(round){
    if(!tournament) return;
    const firstRound = tournament.firstRound;
    // FIRST ROUND → all registered teams
    if(round === firstRound){
      const snap = await getDocs(collection(db,"teams"));
      const list = snap.docs.map(d=>({
        id:d.id,
        ...d.data()
      }));
      setTeams(list);
      return;
    }

    // NEXT ROUND → winners of previous round
    const index = ROUND_ORDER.indexOf(round);
    const prevRound = ROUND_ORDER[index-1];
    const snap = await getDocs(collection(db,"matchResults"));
    console.log("snap.docs --> ",snap.docs);
    console.log("snap.docs.data --> ",snap.docs.map(d=>d.data()));
    const winners = snap.docs
      .map(d=>d.data())
      .filter(m => m.round === prevRound)
      .map(m => ({
        id: m.winner,
        teamName: m.winner
      }));
      console.log("winners --> ",winners);
    setTeams(winners);
  }

  async function loadMatches(){
    const snap = await getDocs(collection(db,"tournamentMatches"));
    const list = snap.docs.map(d=>({ id:d.id,...d.data() }));
    setMatches(list);
  }

  async function getWinnerTeams(round){
        const snap = await getDocs(collection(db,"matchResults"))
        const winners = snap.docs
            .map(d=>d.data())
            .filter(m=>m.round === round)
            .map(m=>m.winner)
        return winners
  }

  async function createMatch(){
    if(exists){
        alert("Match label already exists for this round")
        return
    }
    if(teamA === teamB){
        alert("Same team cannot play against itself")
        return
    }
    console.log("matchLabel ", matchLabel);
    console.log("teamA ", teamA);
    console.log("teamB ", teamB);
    if(!matchLabel || !teamA || !teamB){
      alert("Fill all fields");
      return;
    }

    const teamUsed = matches.some(m =>

        m.round === round &&
        m.id !== editingMatchId &&
        (
        m.teamAId === teamA ||
        m.teamBId === teamA ||
        m.teamAId === teamB ||
        m.teamBId === teamB
        )
    )

    if(teamUsed){
        alert("Team already used in this round")
        return
    }

    await addDoc(collection(db,"tournamentMatches"),{
      label: matchLabel.toUpperCase(),
      round,
      teamAId: teamA,
      teamBId: teamB,
      createdAt: serverTimestamp()
    });

    setMatchLabel("");
    setTeamA("");
    setTeamB("");

    loadMatches();
  }

  async function deleteMatch(id){
    if(!confirm("Delete this match?")) return;
    await deleteDoc(doc(db,"tournamentMatches",id));
    loadMatches();
  }

  function getTeamName(id){
    return teamMap[id] || "";
  }

  const sortedTeams = [...teams].sort((a, b) =>
    a.teamName.localeCompare(b.teamName)
  );

  const matchesByRound = {}; 
  ROUND_ORDER.forEach(r => {
    matchesByRound[r] = matches
      .filter(m => m.round === r)
      .sort((a, b) =>
        a.label.localeCompare(b.label, undefined, { numeric: true })
      );
  });

  return(
    <div className="match-screen">
      {/* LEFT FORM */}
      <div className="match-form">
        <h2>Create Match</h2>
        <select
          value={round}
          onChange={e=>setRound(e.target.value)}
        >
          {availableRounds.map(r => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>

        <select
          value={matchLabel}
          onChange={(e)=>setMatchLabel(e.target.value)}
        >
          <option value="">Select Match</option>

          {matchLabels.map(label => (
            <option 
              key={label} 
              value={label} 
              disabled={matches.some(m => m.round === round && m.label === label)}>
                {label}
            </option>
          ))}

        </select>

        <select
          value={teamA}
          onChange={e => setTeamA(e.target.value)}
        >
          <option value="">Select Team</option>
          {sortedTeams.map(t => (
            <option
              key={t.id}
              value={t.id}
              className={isSelected.includes(t.id) ? "team-used" : ""}
            >
              {t.teamName}
            </option>
          ))}
        </select>

        <select
          value={teamB}
          onChange={e => setTeamB(e.target.value)}
        >
          <option value="">Select Team</option>
          {sortedTeams.map(t => (
            <option
              key={t.id}
              value={t.id}
              className={isSelected.includes(t.id) ? "team-used" : ""}
            >
              {t.teamName}
            </option>
          ))}
        </select>
        
        <div className="form-buttons">
            <button className="save-btn" onClick={createMatch}>
                {editingMatchId ? "Update Match" : "Add Match"}
            </button>
            {editingMatchId && (
                <button className="cancel-btn"
                    onClick={()=>{
                        setEditingMatchId(null)
                        resetForm();
                    }}
                >
                    Cancel
                </button>
            )}
        </div>
      </div>

      {/* RIGHT MATCH LIST */}
      <div className="match-list">
        <h2>Created Matches</h2>

        {availableRounds.map(roundName => {
          const roundMatches = matchesByRound[roundName] || [];
          return (
            <div key={roundName} className="round-group">
              <h3
                className="round-header"
                onClick={() =>
                  setOpenRound(openRound === roundName ? null : roundName)
                }
              >
                <span
                  className={`round-arrow ${
                    openRound === roundName ? "open" : ""
                  }`}
                >
                  ▶
                </span>
                {roundName} ({roundMatches.length})
              </h3>
              
                <div className={`match-grid-wrapper ${ openRound === roundName ? "open" : "" }`} >
                  <div className="match-grid">
                  {roundMatches.map(m => (
                    <div key={m.id} className="match-card">
                      <div className="match-label"> {m.label} </div>
                      <div className="match-teams">
                        {getTeamName(m.teamAId)} <span> vs </span> {getTeamName(m.teamBId)}
                      </div>
                      <div className="team-actions">
                        <button className="edit-btn" onClick={() => startEdit(m)} >
                          Edit
                        </button>
                        <button className="delete-btn" onClick={() => deleteMatch(m.id)} >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>        
            
          );
        })}
      </div>
    </div>
  );
}