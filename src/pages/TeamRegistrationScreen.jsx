import { useState, useEffect } from "react";
import { db } from "../firebase/firebase";
import { collection, addDoc, getDocs, serverTimestamp } from "firebase/firestore";

export default function TeamRegistrationScreen() {

  const [teamName, setTeamName] = useState("");
  const [player1, setPlayer1] = useState("");
  const [player2, setPlayer2] = useState("");
  const [ageGroup, setAgeGroup] = useState("Open");
  const [address, setAddress] = useState("");

  const [teams, setTeams] = useState([]);

  async function saveTeam(){

    if(!player1 || !player2){
        alert("Player names required");
        return;
    }

    let finalTeamName = teamName;

    if(!teamName){
        finalTeamName = `Team ${player1} & ${player2}`;
    }

    await addDoc(collection(db,"teams"),{
        teamName: finalTeamName,
        players:[player1,player2],
        ageGroup,
        address,
        createdAt: serverTimestamp()
    });

    setTeamName("");
    setPlayer1("");
    setPlayer2("");
    setAddress("");

    loadTeams();
  }

  async function loadTeams() {

    const snap = await getDocs(collection(db,"teams"));

    const list = snap.docs.map(d => ({
      id:d.id,
      ...d.data()
    }));

    setTeams(list);
  }

  useEffect(()=>{
    loadTeams();
  },[]);

  return (
    <div className="team-screen">
        <h1 className="team-title">TEAM REGISTRATION</h1>
        <div className="team-layout">
            {/* LEFT SIDE FORM */}
            <div className="team-form-panel">
                <h2>Add Team</h2>
                <div className="team-form">
                    <input
                        placeholder="Team Name (optional)"
                        value={teamName}
                        onChange={(e)=>setTeamName(e.target.value)}
                    />
                    <input
                        placeholder="Player 1"
                        value={player1}
                        onChange={(e)=>setPlayer1(e.target.value)}
                    />
                    <input
                        placeholder="Player 2"
                        value={player2}
                        onChange={(e)=>setPlayer2(e.target.value)}
                    />
                    <select
                        value={ageGroup}
                        onChange={(e)=>setAgeGroup(e.target.value)}
                    >
                        <option>Open</option>
                        <option>Under 18</option>
                        <option>Under 21</option>
                        <option>35+</option>
                    </select>
                    <input
                        placeholder="Address"
                        value={address}
                        onChange={(e)=>setAddress(e.target.value)}
                    />
                    <button onClick={saveTeam}> Save Team </button>
                </div>
            </div>

            {/* RIGHT SIDE TEAM LIST */}
            <div className="team-list-panel">
                <h2>Registered Teams</h2>
                <div className="team-list">
                    {teams.map(t => (
                        <div key={t.id} className="team-card">
                            <div className="team-name-registration">
                                {t.teamName.toUpperCase()}
                            </div>
                            <div className="players">
                                {t.players?.join(" / ").toUpperCase()}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
  )
}