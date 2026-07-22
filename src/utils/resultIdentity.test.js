import test from "node:test";
import assert from "node:assert/strict";
import {
  buildMatchResultPayload,
  getProgressionAssignments,
  getRoundWinnerTeams,
  getSelectableMatches,
  isMatchCompleted,
  resolveLegacyWinnerTeam,
  resultMatchesTournamentMatch,
} from "./utility.js";

const teams = [
  { id: "team-a-id", teamName: "Team A" },
  { id: "team-b-id", teamName: "Team B" },
  { id: "team-c-id", teamName: "Team C" },
  { id: "team-d-id", teamName: "Team D" },
  { id: "team-e-id", teamName: "Team E" },
  { id: "team-f-id", teamName: "Team F" },
  { id: "team-g-id", teamName: "Team G" },
  { id: "team-h-id", teamName: "Team H" },
];

const match = (id, label, round, teamAId, teamBId) => ({
  id,
  label,
  round,
  teamAId,
  teamBId,
});

const qfMatches = [
  match("qf1-id", "QF1", "QF", "team-a-id", "team-b-id"),
  match("qf2-id", "QF2", "QF", "team-c-id", "team-d-id"),
  match("qf3-id", "QF3", "QF", "team-e-id", "team-f-id"),
  match("qf4-id", "QF4", "QF", "team-g-id", "team-h-id"),
  match("sf1-id", "SF1", "SF", "team-a-id", "team-d-id"),
  match("sf2-id", "SF2", "SF", "team-e-id", "team-h-id"),
  match("final-id", "Final", "F", "team-d-id", "team-h-id"),
];

test("new result payload contains stable match and team identifiers plus display winner", () => {
  const payload = buildMatchResultPayload({
    tournamentMatchNumber: 3,
    prematch: {
      matchId: "qf1-id",
      tournamentMatchId: "qf1-id",
      matchLabel: "QF1",
      round: "QF",
      teamAId: "team-a-id",
      teamBId: "team-b-id",
    },
    teamInfo: {
      teamA: "Team A",
      teamB: "Team B",
    },
    gamesWon: {
      teamA: 2,
      teamB: 1,
    },
    setResults: [{ teamA: 21, teamB: 19 }],
    matchTiming: {
      startTime: 1000,
      endTime: 91000,
    },
  }, "timestamp");

  assert.equal(payload.matchId, "qf1-id");
  assert.equal(payload.tournamentMatchId, "qf1-id");
  assert.equal(payload.winnerTeamId, "team-a-id");
  assert.equal(payload.winnerTeamName, "Team A");
  assert.equal(payload.winner, "Team A");
  assert.equal(payload.teamAId, "team-a-id");
  assert.equal(payload.teamBId, "team-b-id");
  assert.equal(payload.durationSeconds, 90);
});

test("new results match by matchId even if the label changes", () => {
  assert.equal(
    resultMatchesTournamentMatch(
      { matchId: "qf1-id", matchLabel: "Old Label", round: "SF" },
      { id: "qf1-id", label: "QF1", round: "QF" }
    ),
    true
  );
});

test("legacy completion detection still works by round and normalized label", () => {
  assert.equal(
    isMatchCompleted(
      { id: "qf1-id", label: "Quarter Final 1", round: "QF" },
      [{ matchLabel: "QF1", round: "QF" }]
    ),
    true
  );
  assert.equal(
    isMatchCompleted(
      { id: "qf1-id", label: "QF1", round: "QF" },
      [{ matchLabel: "QF1", round: "QF" }]
    ),
    true
  );
});

test("legacy winner resolves only when the display name is unique", () => {
  assert.equal(resolveLegacyWinnerTeam({ winner: "Team A" }, teams).team.id, "team-a-id");
  assert.equal(
    resolveLegacyWinnerTeam({ winner: "Team A" }, [...teams, { id: "duplicate-id", teamName: "Team A" }]).status,
    "ambiguous-legacy-name"
  );
  assert.equal(resolveLegacyWinnerTeam({ winner: "Missing Team" }, teams).status, "unresolved-legacy-name");
});

test("QF winners map to the expected SF slots using team ids", () => {
  const results = [
    { matchId: "qf1-id", round: "QF", matchLabel: "QF1", winnerTeamId: "team-a-id", winnerTeamName: "Team A" },
    { matchId: "qf2-id", round: "QF", matchLabel: "QF2", winnerTeamId: "team-d-id", winnerTeamName: "Team D" },
    { matchId: "qf3-id", round: "QF", matchLabel: "QF3", winnerTeamId: "team-e-id", winnerTeamName: "Team E" },
    { matchId: "qf4-id", round: "QF", matchLabel: "QF4", winnerTeamId: "team-h-id", winnerTeamName: "Team H" },
  ];
  const assignments = getProgressionAssignments("QF", "SF", results, qfMatches, teams);

  assert.equal(assignments[0].targetMatch.id, "sf1-id");
  assert.equal(assignments[0].teamA.id, "team-a-id");
  assert.equal(assignments[0].teamB.id, "team-d-id");
  assert.equal(assignments[1].targetMatch.id, "sf2-id");
  assert.equal(assignments[1].teamA.id, "team-e-id");
  assert.equal(assignments[1].teamB.id, "team-h-id");
  assert.equal(assignments.length, 2);
});

test("SF winners map to the Final using team ids", () => {
  const results = [
    { matchId: "sf1-id", round: "SF", matchLabel: "SF1", winnerTeamId: "team-d-id", winnerTeamName: "Team D" },
    { matchId: "sf2-id", round: "SF", matchLabel: "SF2", winnerTeamId: "team-h-id", winnerTeamName: "Team H" },
  ];
  const assignments = getProgressionAssignments("SF", "F", results, qfMatches, teams);

  assert.equal(assignments[0].targetMatch.id, "final-id");
  assert.equal(assignments[0].teamA.id, "team-d-id");
  assert.equal(assignments[0].teamB.id, "team-h-id");
});

test("stable winner list never writes display names into id fields", () => {
  const winners = getRoundWinnerTeams(
    "QF",
    [{ matchId: "qf1-id", round: "QF", matchLabel: "QF1", winner: "Team A" }],
    qfMatches,
    teams
  );

  assert.equal(winners[0].team.id, "team-a-id");
  assert.notEqual(winners[0].team.id, "Team A");
});

test("future match is not selectable when a team id does not exist", () => {
  const selectable = getSelectableMatches([
    match("sf1-id", "SF1", "SF", "team-a-id", "missing-team-id"),
  ], [], teams);

  assert.deepEqual(selectable, []);
});
