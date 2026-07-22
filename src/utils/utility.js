export default function confirmAction(message) {
  return window.confirm(message)
}

const ROUND_ALIASES = {
  SUPER32: "SUPER32",
  "SUPER 32": "SUPER32",
  S32: "SUPER32",
  PREQF: "PREQF",
  PQF: "PREQF",
  "PRE QF": "PREQF",
  "PRE QUARTER FINAL": "PREQF",
  "PRE QUARTER FINALS": "PREQF",
  "PRE-QUARTER FINAL": "PREQF",
  "PRE-QUARTER FINALS": "PREQF",
  QF: "QF",
  QUARTERFINAL: "QF",
  "QUARTER FINAL": "QF",
  "QUARTER FINALS": "QF",
  SF: "SF",
  SEMIFINAL: "SF",
  "SEMI FINAL": "SF",
  "SEMI FINALS": "SF",
  "SEMI-FINAL": "SF",
  "SEMI-FINALS": "SF",
  F: "F",
  FINAL: "F",
  FINALS: "F",
};

const ROUND_PRIORITY = {
  SUPER32: 10,
  PREQF: 20,
  QF: 30,
  SF: 40,
  F: 50,
};

export function getMatchLabels(round) {
  const map = {
    SUPER32: 16,
    PREQF: 8,
    QF: 4,
    SF: 2,
    F: 1
  };
  const count = map[round] || 1;
  return Array.from({ length: count }, (_, i) => `${round}${i + 1}`);
}

export function normalizeText(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ");
}

export function normalizeRound(round) {
  const text = normalizeText(round);
  return ROUND_ALIASES[text] || ROUND_ALIASES[text.replace(/\s+/g, "")] || text;
}

export function getRoundPriority(round) {
  const normalized = normalizeRound(round);
  return ROUND_PRIORITY[normalized] || 999;
}

export function parseTournamentMatchLabel(label) {
  const text = normalizeText(label);

  if (!text) {
    return { round: "", sequence: Number.MAX_SAFE_INTEGER };
  }

  for (const [alias, round] of Object.entries(ROUND_ALIASES)) {
    const escapedAlias = alias.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`^${escapedAlias}\\s*(\\d+)?$`);
    const compactPattern = new RegExp(`^${escapedAlias.replace(/\s+/g, "")}(\\d+)?$`);
    const match = text.match(pattern) || text.replace(/\s+/g, "").match(compactPattern);

    if (match) {
      return {
        round,
        sequence: match[1] ? Number(match[1]) : round === "F" ? 1 : Number.MAX_SAFE_INTEGER,
      };
    }
  }

  const sequenceMatch = text.match(/(\d+)\s*$/);
  return {
    round: normalizeRound(text.replace(/\d+\s*$/, "").trim()),
    sequence: sequenceMatch ? Number(sequenceMatch[1]) : Number.MAX_SAFE_INTEGER,
  };
}

export function getTournamentMatchRound(match) {
  return normalizeRound(match?.round || parseTournamentMatchLabel(match?.label).round);
}

export function getTournamentMatchSequence(match) {
  const labelInfo = parseTournamentMatchLabel(match?.label);
  const rawNumber = match?.matchNumber ?? match?.sequence ?? match?.order;
  const structuredNumber = Number(rawNumber);

  if (Number.isFinite(structuredNumber)) {
    return structuredNumber;
  }

  return labelInfo.sequence;
}

export function sortTournamentMatches(matches) {
  return [...(matches || [])].sort((a, b) => {
    const roundDiff = getRoundPriority(getTournamentMatchRound(a)) - getRoundPriority(getTournamentMatchRound(b));
    if (roundDiff !== 0) return roundDiff;

    const sequenceDiff = getTournamentMatchSequence(a) - getTournamentMatchSequence(b);
    if (sequenceDiff !== 0) return sequenceDiff;

    return String(a?.label || "").localeCompare(String(b?.label || ""), undefined, { numeric: true });
  });
}

export function isMatchReady(match, teams = null) {
  if (!match) return false;
  if (match.bye || match.autoAdvanced || match.autoAdvance) return false;
  if (!match.teamAId || !match.teamBId) return false;

  if (!teams) return true;

  const teamIds = new Set((teams || []).map(team => team.id));
  return teamIds.has(match.teamAId) && teamIds.has(match.teamBId);
}

function sameResultRound(result, match) {
  const resultRound = normalizeRound(result?.round || parseTournamentMatchLabel(result?.matchLabel).round);
  const matchRound = getTournamentMatchRound(match);
  return !resultRound || !matchRound || resultRound === matchRound;
}

function sameResultLabel(result, match) {
  if (normalizeText(result?.matchLabel) === normalizeText(match?.label)) {
    return true;
  }

  const resultLabel = parseTournamentMatchLabel(result?.matchLabel);
  const matchLabel = parseTournamentMatchLabel(match?.label);

  return Boolean(
    resultLabel.round &&
    matchLabel.round &&
    resultLabel.round === matchLabel.round &&
    resultLabel.sequence === matchLabel.sequence
  );
}

export function resultMatchesTournamentMatch(result, match) {
  if (!result || !match) return false;

  const resultMatchId = result.matchId || result.tournamentMatchId;
  const matchId = match.id || match.matchId || match.tournamentMatchId;

  if (resultMatchId && matchId) {
    return resultMatchId === matchId;
  }

  return sameResultLabel(result, match) && sameResultRound(result, match);
}

export function isMatchCompleted(match, results = []) {
  if (!match) return false;
  if (match.bye || match.autoAdvanced || match.autoAdvance) return true;
  if (match.status === "completed" || match.completed || match.matchFinished) return true;

  return (results || []).some(result => {
    return resultMatchesTournamentMatch(result, match);
  });
}

export function getActiveTournamentRound(matches, results = []) {
  const active = sortTournamentMatches(matches).find(match => !isMatchCompleted(match, results));
  return active ? getTournamentMatchRound(active) : null;
}

export function getSelectableMatches(matches, results = [], teams = null) {
  const activeRound = getActiveTournamentRound(matches, results);

  if (!activeRound) {
    return [];
  }

  return sortTournamentMatches(matches).filter(match =>
    getTournamentMatchRound(match) === activeRound &&
    isMatchReady(match, teams) &&
    !isMatchCompleted(match, results)
  );
}

export function getTeamDisplayName(team) {
  return team?.teamName || team?.name || "";
}

function teamNameMatches(team, name) {
  return normalizeText(getTeamDisplayName(team)) === normalizeText(name);
}

export function resolveLegacyWinnerTeam(result, teams = []) {
  if (!result) {
    return { team: null, status: "missing-result" };
  }

  if (result.winnerTeamId) {
    const team = teams.find(t => t.id === result.winnerTeamId) || {
      id: result.winnerTeamId,
      teamName: result.winnerTeamName || result.winner,
    };
    return { team, status: "stable-id" };
  }

  const winnerName = result.winnerTeamName || result.winner;
  if (!winnerName) {
    return { team: null, status: "missing-winner" };
  }

  const matches = teams.filter(team => teamNameMatches(team, winnerName));

  if (matches.length === 1) {
    return { team: matches[0], status: "legacy-name" };
  }

  if (matches.length > 1) {
    return { team: null, status: "ambiguous-legacy-name" };
  }

  return { team: null, status: "unresolved-legacy-name" };
}

export function getRoundWinnerTeams(round, results = [], matches = [], teams = []) {
  const roundMatches = sortTournamentMatches(matches).filter(
    match => getTournamentMatchRound(match) === normalizeRound(round)
  );

  return roundMatches
    .map(match => {
      const result = (results || []).find(r => resultMatchesTournamentMatch(r, match));
      if (!result) return null;

      const resolution = resolveLegacyWinnerTeam(result, teams);
      if (!resolution.team?.id) {
        return {
          match,
          result,
          team: null,
          status: resolution.status,
        };
      }

      return {
        match,
        result,
        team: {
          id: resolution.team.id,
          teamName: getTeamDisplayName(resolution.team) || result.winnerTeamName || result.winner,
        },
        status: resolution.status,
      };
    })
    .filter(Boolean);
}

export function getProgressionAssignments(sourceRound, targetRound, results = [], matches = [], teams = []) {
  const winners = getRoundWinnerTeams(sourceRound, results, matches, teams)
    .filter(entry => entry.team);
  const targetMatches = sortTournamentMatches(matches).filter(
    match => getTournamentMatchRound(match) === normalizeRound(targetRound)
  );

  return targetMatches.map((targetMatch, index) => ({
    targetMatch,
    teamA: winners[index * 2]?.team || null,
    teamB: winners[index * 2 + 1]?.team || null,
  }));
}

export function buildMatchResultPayload(game, createdAt) {
  const winner =
    game.gamesWon.teamA > game.gamesWon.teamB ? "teamA" : "teamB";
  const winnerTeamId = winner === "teamA"
    ? game.prematch?.teamAId
    : game.prematch?.teamBId;
  const winnerTeamName = game.teamInfo[winner];
  const start = game.matchTiming?.startTime;
  const end = game.matchTiming?.endTime;
  const duration = start && end
    ? Math.floor((end - start) / 1000)
    : null;

  return {
    matchNumber: game.tournamentMatchNumber,
    matchId: game.prematch?.tournamentMatchId || game.prematch?.matchId || null,
    tournamentMatchId: game.prematch?.tournamentMatchId || game.prematch?.matchId || null,
    matchLabel: game.prematch?.matchLabel || "",
    round: normalizeRound(game.prematch?.round || String(game.prematch?.matchLabel || "").replace(/[0-9]/g,'')),
    teamAId: game.prematch?.teamAId || null,
    teamAName: game.teamInfo.teamA,
    teamBId: game.prematch?.teamBId || null,
    teamBName: game.teamInfo.teamB,
    winnerTeamId: winnerTeamId || null,
    winnerTeamName,
    winner: winnerTeamName,
    gamesWon: game.gamesWon,
    setResults: game.setResults,
    durationSeconds: duration,
    completedAt: createdAt,
    createdAt,
  };
}

export function getResultTimestampMillis(result) {
  const value = result?.completedAt ?? result?.timestamp ?? result?.createdAt ?? result?.updatedAt;

  if (!value) return null;

  if (typeof value.toMillis === "function") {
    const millis = value.toMillis();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value.toDate === "function") {
    const millis = value.toDate().getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value === "object" && typeof value.seconds === "number") {
    const millis = value.seconds * 1000 + Math.floor((value.nanoseconds || 0) / 1000000);
    return Number.isFinite(millis) ? millis : null;
  }

  if (value instanceof Date) {
    const millis = value.getTime();
    return Number.isFinite(millis) ? millis : null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  if (typeof value === "string") {
    const millis = Date.parse(value);
    return Number.isFinite(millis) ? millis : null;
  }

  return null;
}

export function sortMatchResultsNewestFirst(results = []) {
  return [...results]
    .map((result, index) => ({
      result,
      index,
      timestamp: getResultTimestampMillis(result),
    }))
    .sort((a, b) => {
      const aHasTime = a.timestamp !== null;
      const bHasTime = b.timestamp !== null;

      if (aHasTime && bHasTime && a.timestamp !== b.timestamp) {
        return b.timestamp - a.timestamp;
      }

      if (aHasTime !== bHasTime) {
        return aHasTime ? -1 : 1;
      }

      return a.index - b.index;
    })
    .map(entry => entry.result);
}

export function formatDuration(sec){
  if(!sec) return "-";
  const m = Math.floor(sec/60);
  const s = sec % 60;
  return `${m}:${s.toString().padStart(2,'0')}`;
}
