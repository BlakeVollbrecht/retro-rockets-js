const STORAGE_KEY = "retrorockets-highscores";
const LAST_NAME_KEY = "retrorockets-lastname";
const MAX_HIGH_SCORES = 5;

function emptyTable() {
  return {};
}

export function loadScores() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || emptyTable();
  } catch {
    return emptyTable();
  }
}

export function loadLastName() {
  try {
    const name = localStorage.getItem(LAST_NAME_KEY);
    if (name && /^[A-Z]{3}$/.test(name)) return name;
  } catch {
    /* ignore quota / private-mode failures */
  }
  return "AAA";
}

export function saveLastName(name) {
  try {
    localStorage.setItem(LAST_NAME_KEY, name);
  } catch {
    /* ignore quota / private-mode failures */
  }
}

export function saveScore(levelName, playerName, score) {
  saveLastName(playerName);
  const table = loadScores();
  const list = table[levelName] || [];
  list.push({ name: playerName, score, at: Date.now() });
  list.sort((a, b) => b.score - a.score);
  table[levelName] = list.slice(0, MAX_HIGH_SCORES);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(table));
  return table[levelName];
}

export function scoresFor(levelName) {
  return (loadScores()[levelName] || []).slice(0, MAX_HIGH_SCORES);
}

export function scorePlacement(levelName, score) {
  const existing = scoresFor(levelName);
  const betterOrEqual = existing.filter((row) => row.score >= score).length;
  const rank = betterOrEqual + 1;
  const above =
    betterOrEqual > 0
      ? {
          rank: betterOrEqual,
          name: existing[betterOrEqual - 1].name,
          score: existing[betterOrEqual - 1].score,
        }
      : null;
  const below =
    betterOrEqual < existing.length
      ? {
          rank: rank + 1,
          name: existing[betterOrEqual].name,
          score: existing[betterOrEqual].score,
        }
      : null;
  return {
    rank,
    above,
    below,
    isNewHigh: existing.length > 0 && rank === 1,
    isLowest: existing.length > 0 && !below,
  };
}

export function formatScoreDate(at) {
  if (typeof at !== "number" || !Number.isFinite(at)) return "";
  const date = new Date(at);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}
