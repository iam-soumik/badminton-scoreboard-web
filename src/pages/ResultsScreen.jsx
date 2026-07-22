import { useEffect, useState } from "react";
import { db } from "../firebase/firebase";
import { collection, getDocs } from "firebase/firestore";
import { getTournamentMatchRound, resultMatchesTournamentMatch, sortMatchResultsNewestFirst } from "../utils/utility";

export default function ResultsScreen() {

  const [results, setResults] = useState([]);

  useEffect(() => {

    async function loadResults() {

        const [resultSnap, matchSnap, teamSnap] = await Promise.all([
            getDocs(collection(db, "matchResults")),
            getDocs(collection(db, "tournamentMatches")),
            getDocs(collection(db, "teams")),
        ]);
        const matchList = matchSnap.docs.map(d => ({ id: d.id, ...d.data() }));
        const teamMap = {};
        teamSnap.docs.forEach(d => {
            teamMap[d.id] = { id: d.id, ...d.data() };
        });
        const list = [];
        for (const d of resultSnap.docs) {
            const result = d.data();
            const match = matchList.find(m => resultMatchesTournamentMatch(result, m));
            const teamAId = result.teamAId || match?.teamAId;
            const teamBId = result.teamBId || match?.teamBId;
            const winnerTeamId = result.winnerTeamId;
            const teamAData = teamMap[teamAId];
            const teamBData = teamMap[teamBId];
            const winnerTeamData = teamMap[winnerTeamId];
            const teamA = teamAData?.players?.join(" / ") || result.teamAName || "Team A";
            const teamB = teamBData?.players?.join(" / ") || result.teamBName || "Team B";
            const winnerDisplay = winnerTeamData?.players?.join(" / ") || result.winnerTeamName || result.winner;

            list.push({
                id: d.id,
                ...result,
                match,
                teamA,
                teamB,
                winnerDisplay
            });
        }
        setResults(sortMatchResultsNewestFirst(list));
    }

    loadResults();

  }, []);

    const groupedResults = {};

    results.forEach(r => {

        const roundCode = getTournamentMatchRound(r.match || r); // QF

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
                            return (
                                <tr key={r.id}>
                                    <td>{r.matchLabel.split(" ")[0]}</td>
                                    <td>{r.teamA?.toUpperCase()}</td>
                                    <td>{r.teamB?.toUpperCase()}</td>
                                    <td>{setScores}</td>
                                    <td className="winner-cell">
                                        {r.winnerDisplay?.toUpperCase()}
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
