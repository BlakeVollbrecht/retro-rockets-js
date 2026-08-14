const STORAGE_KEY = "retrorockets-highscores";

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

export function saveScore(levelName, playerName, score) {
  const table = loadScores();
  const list = table[levelName] || [];
  list.push({ name: playerName, score });
  list.sort((a, b) => b.score - a.score);
  table[levelName] = list.slice(0, 8);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(table));
  return table[levelName];
}

export function scoresFor(levelName) {
  return loadScores()[levelName] || [];
}
