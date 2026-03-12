import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import MatchHistoryView from "../components/MatchHistoryView";

export default function MatchHistoryScreen() {

  const [game,setGame] = useState(null);

  useEffect(()=>{

    const loadHistory = async () => {

      const snap = await getDoc(doc(db,"matches","live"));

      if(snap.exists()){
        const data = snap.data();

        if(data.gameState){
          setGame(data.gameState);
        }
      }

    }

    loadHistory();

  },[]);

  if(!game){
    return <div>No match history available</div>
  }

  const history = game.history || [];

  return (
    <MatchHistoryView
        game={game}
        isPopup={false}
    />
  )
}