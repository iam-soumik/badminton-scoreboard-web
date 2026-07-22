import test from "node:test";
import assert from "node:assert/strict";
import {
  getActiveTournamentRound,
  getSelectableMatches,
  isMatchCompleted,
  parseTournamentMatchLabel,
  sortTournamentMatches,
} from "./utility.js";

const match = (id, label, round, extra = {}) => ({
  id,
  label,
  round,
  teamAId: `${id}-team-a`,
  teamBId: `${id}-team-b`,
  ...extra,
});

test("sorts QF labels by numeric sequence", () => {
  const labels = sortTournamentMatches([
    match("qf4", "QF4", "QF"),
    match("qf2", "QF2", "QF"),
    match("qf1", "QF1", "QF"),
    match("qf3", "QF3", "QF"),
  ]).map(m => m.label);

  assert.deepEqual(labels, ["QF1", "QF2", "QF3", "QF4"]);
});

test("sorts QF2 before QF10", () => {
  const labels = sortTournamentMatches([
    match("qf10", "QF10", "QF"),
    match("qf2", "QF2", "QF"),
  ]).map(m => m.label);

  assert.deepEqual(labels, ["QF2", "QF10"]);
});

test("during QF, no SF or Final match appears", () => {
  const selectable = getSelectableMatches([
    match("qf1", "QF1", "QF"),
    match("sf1", "SF1", "SF"),
    match("f1", "Final", "F"),
  ]);

  assert.deepEqual(selectable.map(m => m.label), ["QF1"]);
});

test("SF becomes available only after all QF matches finish", () => {
  const matches = [
    match("qf1", "QF1", "QF"),
    match("qf2", "QF2", "QF"),
    match("sf1", "SF1", "SF"),
  ];

  assert.equal(getActiveTournamentRound(matches, [{ matchLabel: "QF1", round: "QF" }]), "QF");
  assert.equal(
    getActiveTournamentRound(matches, [
      { matchLabel: "QF1", round: "QF" },
      { matchLabel: "QF2", round: "QF" },
    ]),
    "SF"
  );
});

test("Final becomes available only after all SF matches finish", () => {
  const matches = [
    match("sf1", "Semi Final 1", "SF"),
    match("sf2", "SF2", "SF"),
    match("final", "Final", "F"),
  ];

  assert.equal(getActiveTournamentRound(matches, [{ matchLabel: "Semi Final 1", round: "SF" }]), "SF");
  assert.equal(
    getActiveTournamentRound(matches, [
      { matchLabel: "Semi Final 1", round: "SF" },
      { matchLabel: "SF2", round: "SF" },
    ]),
    "F"
  );
});

test("a tournament beginning directly at SF works", () => {
  const selectable = getSelectableMatches([
    match("sf2", "SF2", "SF"),
    match("sf1", "SF1", "SF"),
    match("final", "Final", "F"),
  ]);

  assert.deepEqual(selectable.map(m => m.label), ["SF1", "SF2"]);
});

test("completed matches are excluded from the selectable list", () => {
  const selectable = getSelectableMatches([
    match("qf1", "QF1", "QF"),
    match("qf2", "QF2", "QF"),
  ], [{ matchLabel: "QF1", round: "QF" }]);

  assert.deepEqual(selectable.map(m => m.label), ["QF2"]);
});

test("malformed labels do not crash sorting or parsing", () => {
  assert.doesNotThrow(() => parseTournamentMatchLabel("mystery label"));
  assert.deepEqual(sortTournamentMatches([match("bad", "mystery label", "")]).map(m => m.label), ["mystery label"]);
});

test("all matches completed has no active round or selectable matches", () => {
  const matches = [
    match("sf1", "SF1", "SF"),
    match("final", "Final", "F"),
  ];
  const results = [
    { matchLabel: "SF1", round: "SF" },
    { matchLabel: "Final", round: "F" },
  ];

  assert.equal(getActiveTournamentRound(matches, results), null);
  assert.deepEqual(getSelectableMatches(matches, results), []);
});

test("a stale selected future-round match is not selectable", () => {
  const matches = [
    match("qf1", "QF1", "QF"),
    match("sf1", "SF1", "SF"),
  ];

  assert.equal(getSelectableMatches(matches).some(m => m.id === "sf1"), false);
});

test("a partially generated current round blocks future-round matches", () => {
  const matches = [
    match("qf1", "QF1", "QF", { teamBId: "" }),
    match("sf1", "SF1", "SF"),
  ];

  assert.equal(getActiveTournamentRound(matches), "QF");
  assert.deepEqual(getSelectableMatches(matches), []);
});

test("bye or auto-advanced matches are not selectable", () => {
  const matches = [
    match("qf1", "QF1", "QF", { bye: true }),
    match("qf2", "QF2", "QF", { autoAdvanced: true }),
    match("qf3", "QF3", "QF"),
  ];

  assert.deepEqual(getSelectableMatches(matches).map(m => m.label), ["QF3"]);
});

test("completed matches can also be detected by match id", () => {
  assert.equal(isMatchCompleted(match("abc", "Quarter Final 1", "QF"), [{ matchId: "abc" }]), true);
});
