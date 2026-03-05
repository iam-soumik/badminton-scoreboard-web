import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
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
  const [matchLabel,setMatchLabel] = useState("");
  const [teamA,setTeamA] = useState("");
  const [teamB,setTeamB] = useState("");
  const [editingMatchId,setEditingMatchId] = useState(null);

  const exists = matches.some( m =>
        m.round === round &&
        m.label.toUpperCase() === matchLabel.toUpperCase() &&
        m.id !== editingMatchId
    );

  useEffect(()=>{
    //loadTeams();
    loadMatches();
  },[]);

  useEffect(()=>{
    loadTeamsForRound(round)
  },[round]);

  function startEdit(match){
    setEditingMatchId(match.id)
    setRound(match.round)
    setMatchLabel(match.label)
    setTeamA(match.teamAId)
    setTeamB(match.teamBId)
  }

  async function loadTeamsForRound(round){

    const configSnap = await getDoc(doc(db,"tournamentConfig","current"))
    const config = configSnap.data()

    const firstRound = config.firstRound;

    // FIRST ROUND
    if(round === firstRound){
        const snap = await getDocs(collection(db,"teams"))
        const list = snap.docs.map(d=>({
        id:d.id,
        ...d.data()
        }))
        setTeams(list)
        return
    }

    // NEXT ROUNDS → winners of previous round

    const ROUND_ORDER = ["SUPER32","PREQF","QF","SF","F"]

    const index = ROUND_ORDER.indexOf(round)
    const prevRound = ROUND_ORDER[index-1]

    const snap = await getDocs(collection(db,"matchResults"))

    const winners = snap.docs
        .map(d=>d.data())
        .filter(m=>m.round === prevRound)
        .map(m=>({
        id:m.winner,
        teamName:m.winner
        }))

    setTeams(winners)
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

  function getPreviousRound(round){
    const index = ROUND_ORDER.indexOf(round)
    if(index <= 0) return null
    return ROUND_ORDER[index-1]
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
    const t = teams.find(x=>x.id===id);
    return t?.teamName || "";
  }

  return(

    <div className="match-screen">

      {/* LEFT FORM */}
      <div className="match-form">

        <h2>Create Match</h2>

        <select
          value={round}
          onChange={e=>setRound(e.target.value)}
        >
          <option value="SUPER32">Super 32</option>
          <option value="PREQF">Pre Quarter Final</option>
          <option value="QF">Quarter Final</option>
          <option value="SF">Semi Final</option>
          <option value="F">Final</option>
        </select>

        <input
          placeholder="Match Label (QF1, PQF2)"
          value={matchLabel}
          onChange={e=>setMatchLabel(e.target.value)}
        />

        <select
          value={teamA}
          onChange={e=>setTeamA(e.target.value)}
        >
          <option value="">Select Team A</option>
          {teams.map(t=>(
            <option key={t.id} value={t.id}>
              {t.teamName}
            </option>
          ))}
        </select>

        <select
          value={teamB}
          onChange={e=>setTeamB(e.target.value)}
        >
          <option value="">Select Team B</option>
          {teams.map(t=>(
            <option key={t.id} value={t.id}>
              {t.teamName}
            </option>
          ))}
        </select>
        
        <div className="form-buttons">
            <button className="save-btn" onClick={createMatch}>
                Create Match
            </button>
            {editingMatchId && (
                <button className="cancel-btn"
                    onClick={()=>{
                        setEditingMatchId(null)
                        resetForm()
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
        <div className="match-grid">
          {matches.map(m => (
            <div key={m.id} className="match-card">
              <div className="match-label">
                {m.label}
              </div>
              <div className="match-teams">
                {getTeamName(m.teamAId)}
                <span> vs </span>
                {getTeamName(m.teamBId)}
              </div>
              <div className="team-actions">
                <button className="delete-btn" onClick={()=>deleteMatch(m.id)} >
                    Delete
                </button>

                <button className="edit-btn" onClick={() => startEdit(m)} >
                    Edit
                </button>
              </div>
              
            </div>
          ))}

        </div>

      </div>

    </div>
  );
}