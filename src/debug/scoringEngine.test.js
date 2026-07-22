import test from "node:test";
import assert from "node:assert/strict";
import { createScoringEngine } from "../logic/scoringEngine.js";

function scoreLogical(engine, team, points = 1) {
  for (let i = 0; i < points; i++) {
    const state = engine.getState();
    const side = state.courtSides.left === team ? "left" : "right";
    engine.addPoint(side);
  }
}

function startEngine() {
  const engine = createScoringEngine();
  engine.startMatch();
  return engine;
}

function reachScore(engine, teamA, teamB) {
  scoreLogical(engine, "teamA", teamA);
  scoreLogical(engine, "teamB", teamB);
}

function reachTiedScore(engine, score) {
  for (let i = 0; i < score; i++) {
    scoreLogical(engine, "teamA");
    scoreLogical(engine, "teamB");
  }
}

test("scoring is blocked until the match is live", () => {
  const engine = createScoringEngine();

  engine.addPoint("left");

  assert.deepEqual(engine.getState().score, { teamA: 0, teamB: 0 });
  assert.equal(engine.getState().matchStatus, "idle");
});

test("a game ends at 21 with a two-point margin and advances to the next game", () => {
  const engine = startEngine();

  reachScore(engine, 20, 19);
  assert.equal(engine.getState().gameNumber, 1);

  scoreLogical(engine, "teamA");
  const state = engine.getState();

  assert.equal(state.gameNumber, 2);
  assert.deepEqual(state.gamesWon, { teamA: 1, teamB: 0 });
  assert.deepEqual(state.setResults, [{ teamA: 21, teamB: 19 }]);
  assert.deepEqual(state.score, { teamA: 0, teamB: 0 });
  assert.equal(state.courtSides.left, "teamB");
  assert.equal(state.courtSides.right, "teamA");
  assert.equal(state.server.team, "teamA");
});

test("deuce requires a two-point margin before 30", () => {
  const engine = startEngine();

  reachScore(engine, 20, 20);
  scoreLogical(engine, "teamA");
  assert.equal(engine.getState().gameNumber, 1);
  assert.deepEqual(engine.getState().score, { teamA: 21, teamB: 20 });

  scoreLogical(engine, "teamA");
  const state = engine.getState();

  assert.equal(state.gameNumber, 2);
  assert.deepEqual(state.setResults, [{ teamA: 22, teamB: 20 }]);
});

test("a game ends at the 30-point cap without a two-point margin", () => {
  const engine = startEngine();

  reachTiedScore(engine, 29);
  scoreLogical(engine, "teamA");
  const state = engine.getState();

  assert.equal(state.gameNumber, 2);
  assert.deepEqual(state.setResults, [{ teamA: 30, teamB: 29 }]);
  assert.deepEqual(state.gamesWon, { teamA: 1, teamB: 0 });
});

test("a match finishes when one team wins two games", () => {
  const engine = startEngine();

  scoreLogical(engine, "teamA", 21);
  scoreLogical(engine, "teamA", 21);
  const state = engine.getState();

  assert.equal(state.matchStatus, "finished");
  assert.equal(state.matchFinished, true);
  assert.deepEqual(state.gamesWon, { teamA: 2, teamB: 0 });
  assert.deepEqual(state.score, { teamA: 21, teamB: 0 });
  assert.equal(state.matchTiming.endTime > 0, true);
});

test("third game pauses scoring for the mid-game court change at 11", () => {
  const engine = startEngine();

  scoreLogical(engine, "teamA", 21);
  scoreLogical(engine, "teamB", 21);
  scoreLogical(engine, "teamA", 11);

  const pendingState = engine.getState();
  assert.equal(pendingState.gameNumber, 3);
  assert.equal(pendingState.thirdGameSwapPending, true);

  scoreLogical(engine, "teamA");
  assert.equal(engine.getState().score.teamA, 11);

  engine.confirmThirdSetSwap();
  assert.equal(engine.getState().thirdGameSwapPending, false);
  assert.equal(engine.getState().thirdGameSwapDone, true);

  scoreLogical(engine, "teamA");
  assert.equal(engine.getState().score.teamA, 12);
});

test("undo restores the previous scoring snapshot", () => {
  const engine = startEngine();

  scoreLogical(engine, "teamA");
  scoreLogical(engine, "teamA");
  engine.undo();

  assert.deepEqual(engine.getState().score, { teamA: 1, teamB: 0 });
  assert.equal(engine.getState().started, true);
});

test("prematch stable identifiers are retained across full-state restoration", () => {
  const engine = createScoringEngine();
  engine.loadPrematchData({
    matchId: "qf1-id",
    tournamentMatchId: "qf1-id",
    matchLabel: "QF1",
    round: "QF",
    teamAId: "team-a-id",
    teamBId: "team-b-id",
    teamA: { name: "Team A", players: ["A1", "A2"] },
    teamB: { name: "Team B", players: ["B1", "B2"] },
  });
  const restored = createScoringEngine();

  restored.setFullState(engine.getState());

  assert.equal(restored.getState().prematch.tournamentMatchId, "qf1-id");
  assert.equal(restored.getState().prematch.teamAId, "team-a-id");
  assert.equal(restored.getState().prematch.teamBId, "team-b-id");
});

test("prematch team ids stay aligned when logical teams are swapped", () => {
  const engine = createScoringEngine();
  engine.loadPrematchData({
    matchId: "qf1-id",
    tournamentMatchId: "qf1-id",
    matchLabel: "QF1",
    round: "QF",
    teamAId: "team-a-id",
    teamBId: "team-b-id",
    teamA: { name: "Team A", players: ["A1", "A2"] },
    teamB: { name: "Team B", players: ["B1", "B2"] },
  });

  engine.swapTeams();

  assert.equal(engine.getState().teamInfo.teamA, "Team B");
  assert.equal(engine.getState().prematch.teamAId, "team-b-id");
  assert.equal(engine.getState().prematch.teamBId, "team-a-id");
});
