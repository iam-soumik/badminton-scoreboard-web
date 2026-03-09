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
                const teamASnap = await getDoc(doc(db,"teams",m.teamAId));
                const teamBSnap = await getDoc(doc(db,"teams",m.teamBId));
                teamA = teamASnap.data()?.players?.join(" / ") || "Team A";
                teamB = teamBSnap.data()?.players?.join(" / ") || "Team B";
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

    const groupedResults = {};

    results.forEach(r => {

        const matchCode = r.matchLabel.split(" ")[0]; // QF1
        const roundCode = matchCode.replace(/[0-9]/g, ""); // QF

        let roundName = "";

        if (roundCode === "QF") roundName = "QUARTER FINAL";
        else if (roundCode === "SF") roundName = "SEMI FINAL";
        else if (roundCode === "F") roundName = "FINAL";
        else roundName = roundCode;

        if (!groupedResults[roundName]) {
            groupedResults[roundName] = [];
        }

        groupedResults[roundName].push(r);

    });

  return (
    <div className="results-screen">

        <h1 className="results-title">TOURNAMENT RESULTS</h1>
        {Object.entries(groupedResults).map(([round, matches]) => (
            <div key={round} className="round-section">
                <h2 className="round-title">{round}</h2>
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

                        {matches.map(r => {
                            const setScores = (r.setResults || [])
                                .map(s => `${s.teamA}-${s.teamB}`)
                                .join(" ");
                            const winner =
                                r.winner === r.teamAName
                                ? r.teamA
                                : r.teamB;
                            return (
                                <tr key={r.id}>
                                    <td>{r.matchLabel.split(" ")[0]}</td>
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

        ))}

    </div>
    );
}