import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { doc, setDoc, getDoc, serverTimestamp } from "firebase/firestore";

export default function TournamentSetupScreen(){

  const [name,setName] = useState("");
  const [edition,setEdition] = useState("");
  const [venue,setVenue] = useState("");
  const [date,setDate] = useState("");
  const [teamCount,setTeamCount] = useState(8);

  const [firstRound,setFirstRound] = useState("");

  useEffect(()=>{
    loadExistingConfig();
  },[])

  useEffect(()=>{
    setFirstRound(getFirstRound(teamCount));
  },[teamCount])


  function getFirstRound(teamCount){

    if(teamCount >= 32) return "SUPER32"
    if(teamCount >= 16) return "PREQF"
    if(teamCount >= 8) return "QF"
    if(teamCount >= 4) return "SF"

    return "F"
  }


  async function loadExistingConfig(){

    const snap = await getDoc(doc(db,"tournamentConfig","current"))

    if(!snap.exists()) return

    const data = snap.data()

    setName(data.name || "")
    setEdition(data.edition || "")
    setVenue(data.venue || "")
    setDate(data.date || "")
    setTeamCount(data.teamCount || 8)
    setFirstRound(data.firstRound || "QF")

  }


  async function saveTournament(){

    const round = getFirstRound(teamCount)

    await setDoc(
      doc(db,"tournamentConfig","current"),
      {
        name,
        edition,
        venue,
        date,
        teamCount,
        firstRound: round,
        createdAt: serverTimestamp()
      }
    )

    alert("Tournament configuration saved")

  }


  return(

    <div className="tournament-screen">

      <div className="tournament-card">

        <h2>Tournament Setup</h2>

        <input
          placeholder="Tournament Name"
          value={name}
          onChange={e=>setName(e.target.value)}
        />

        <input
          placeholder="Edition"
          value={edition}
          onChange={e=>setEdition(e.target.value)}
        />

        <input
          placeholder="Venue"
          value={venue}
          onChange={e=>setVenue(e.target.value)}
        />

        <input
          type="date"
          value={date}
          onChange={e=>setDate(e.target.value)}
        />

        <label>Number of Teams</label>

        <select
          value={teamCount}
          onChange={e=>setTeamCount(Number(e.target.value))}
        >
          <option value={4}>4 Teams</option>
          <option value={8}>8 Teams</option>
          <option value={16}>16 Teams</option>
          <option value={32}>32 Teams</option>
        </select>

        <div className="round-info">
          First Round: <b>{firstRound}</b>
        </div>

        <button onClick={saveTournament}>
          Save Tournament
        </button>

      </div>

    </div>

  )
}