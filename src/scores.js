const STORAGE_KEY = "retrorockets-highscores";
const LAST_NAME_KEY = "retrorockets-lastname";

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
  table[levelName] = list.slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(table));
  return table[levelName];
}

export function scoresFor(levelName) {
  return loadScores()[levelName] || [];
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
