import test from "node:test";
import assert from "node:assert/strict";
import { sortMatchResultsNewestFirst } from "./utility.js";

test("newest result appears first and oldest result appears last", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: 1000 },
    { matchLabel: "QF3", completedAt: 3000 },
    { matchLabel: "QF2", completedAt: 2000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF3", "QF2", "QF1"]);
});

test("Firestore Timestamp-like values sort correctly", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: { toMillis: () => 1000 } },
    { matchLabel: "QF2", completedAt: { seconds: 2, nanoseconds: 0 } },
    { matchLabel: "QF3", completedAt: { toDate: () => new Date(3000) } },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF3", "QF2", "QF1"]);
});

test("ISO date strings sort correctly", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: "2026-07-22T10:00:00.000Z" },
    { matchLabel: "QF3", completedAt: "2026-07-22T11:15:00.000Z" },
    { matchLabel: "QF2", completedAt: "2026-07-22T10:30:00.000Z" },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF3", "QF2", "QF1"]);
});

test("JavaScript Date objects sort correctly", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: new Date("2026-07-22T10:00:00.000Z") },
    { matchLabel: "QF3", completedAt: new Date("2026-07-22T11:15:00.000Z") },
    { matchLabel: "QF2", completedAt: new Date("2026-07-22T10:30:00.000Z") },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF3", "QF2", "QF1"]);
});

test("numeric timestamps sort correctly", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: 1000 },
    { matchLabel: "QF3", completedAt: 3000 },
    { matchLabel: "QF2", completedAt: 2000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF3", "QF2", "QF1"]);
});

test("completedAt takes priority over legacy timestamp fields", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: 1000, timestamp: 999999, createdAt: 999999 },
    { matchLabel: "QF2", completedAt: 2000, timestamp: 1, createdAt: 1 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF2", "QF1"]);
});

test("missing timestamps appear after valid timestamps", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "Missing" },
    { matchLabel: "QF1", completedAt: 1000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF1", "Missing"]);
});

test("invalid timestamps do not crash sorting", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "Invalid", completedAt: "not a date" },
    { matchLabel: "QF1", completedAt: 1000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF1", "Invalid"]);
});

test("sorting does not mutate the original array", () => {
  const results = [
    { matchLabel: "QF1", completedAt: 1000 },
    { matchLabel: "QF2", completedAt: 2000 },
  ];

  sortMatchResultsNewestFirst(results);

  assert.deepEqual(results.map(result => result.matchLabel), ["QF1", "QF2"]);
});

test("identical timestamps retain stable input ordering", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", completedAt: 1000 },
    { matchLabel: "QF2", completedAt: 1000 },
    { matchLabel: "QF3", completedAt: 1000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF1", "QF2", "QF3"]);
});

test("createdAt is used when completedAt is missing", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", createdAt: 1000 },
    { matchLabel: "QF2", completedAt: 2000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF2", "QF1"]);
});

test("legacy timestamp is used before createdAt when completedAt is missing", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchLabel: "QF1", timestamp: 3000, createdAt: 1000 },
    { matchLabel: "QF2", timestamp: 2000, createdAt: 9999 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchLabel), ["QF1", "QF2"]);
});

test("results matched through stable matchId fields still sort correctly", () => {
  const sorted = sortMatchResultsNewestFirst([
    { matchId: "qf1-id", matchLabel: "Renamed QF1", completedAt: 1000 },
    { matchId: "qf3-id", matchLabel: "Renamed QF3", completedAt: 3000 },
    { matchId: "qf2-id", matchLabel: "Renamed QF2", completedAt: 2000 },
  ]);

  assert.deepEqual(sorted.map(result => result.matchId), ["qf3-id", "qf2-id", "qf1-id"]);
});
