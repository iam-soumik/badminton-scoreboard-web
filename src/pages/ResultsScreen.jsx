import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs, doc, getDoc } from "firebase/firestore";
import { query, where } from "firebase/firestore";

export default function ResultsScreen() {

  const [results, setResults] = useState([]);

  useEffect(() => {

    async function loadResults() {

        const snap = await getDocs(collection(db, "matchResults"));
        const list = [];
        for (const d of snap.docs) {
            const result = d.data();

            // fetch match info from tournamentMatches
            
            const q = query(
            collection(db, "tournamentMatches"),
            where("label", "==", result.matchLabel)
            );

            const querySnap = await getDocs(q);

            console.log("querySnap --> ",querySnap);
            let teamA = "Team A";
            let teamB = "Team B";

            if (!querySnap.empty) {

                const m = querySnap.docs[0].data();

                console.log("m --> ", m);

                teamA = m.teamAPlayers.join(" / ");
                teamB = m.teamBPlayers.join(" / ");
            }

            list.push({
                id: d.id,
                ...result,
                teamA,
                teamB
            });
        }
        console.log("list --> ",list);
        setResults(list);
    }

    loadResults();

  }, []);

  return (
    <div className="results-screen">

        <h1 className="results-title">MATCH RESULTS</h1>

        <table className="results-table">

        <thead>
            <tr>
            <th>Match</th>
            <th>Team 1</th>
            <th>Team 2</th>
            <th>Sets</th>
            <th>Winner</th>
            </tr>
        </thead>

        <tbody>

            {results.map(r => {

            const setScores = (r.setResults || [])
                .map(s => `${s.teamA}-${s.teamB}`)
                .join(" , ");

            const winner =
                r.winner === r.teamAName
                ? r.teamA
                : r.teamB;

            return (

                <tr key={r.id}>

                <td>{r.matchLabel}</td>

                <td>{r.teamA?.toUpperCase()}</td>

                <td>{r.teamB?.toUpperCase()}</td>

                <td>{setScores}</td>

                <td className="winner-cell">
                    {winner?.toUpperCase()}
                </td>

                </tr>

            );

            })}

        </tbody>

        </table>

    </div>
    );
}