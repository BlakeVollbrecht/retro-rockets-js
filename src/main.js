import { loadAll, loadImage, getAlphaData } from "./assets.js";
import { Input } from "./input.js";
import { Lander } from "./lander.js";
import { detectCollisions } from "./collision.js";
import { AudioBus } from "./audio.js";
import { drawGame } from "./render.js";
import { Menus } from "./menus.js";
import { LEVELS, getLevel } from "./levels.js";
import { saveScore } from "./scores.js";
import { drawText } from "./render.js";

const STEP = 1000 / 60;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const gate = document.getElementById("gate");

let audioContext;
let assets;
let audio;
let menus;
let input;
let lander;
let state = "StartMenu";
let currentLevelName = "";
let levelCache = {};
let currentLevel = null;
let landerAlpha = null;
let accumulator = 0;
let lastTime = 0;
let running = false;
let thanksTimer = 0;

async function preloadLevels() {
  for (const level of LEVELS) {
    const ground = await loadImage(level.ground);
    const background = await loadImage(level.background);
    levelCache[level.name] = {
      ground,
      background,
      groundAlpha: getAlphaData(ground),
    };
  }
}

function startLevel(name) {
  currentLevelName = name;
  currentLevel = {
    data: getLevel(name),
    ...levelCache[name],
  };
  lander.reset(currentLevel.data.gravity, currentLevel.data.friction);
  audio.resetGameCues();
  state = "Game";
}

function updateGame() {
  lander.update(input.current);
  detectCollisions(
    lander,
    assets.images.lander,
    landerAlpha,
    currentLevel.ground,
    currentLevel.groundAlpha
  );
  audio.updateGame(lander);
  if (input.pressed("start")) {
    menus.resetPause();
    audio.silenceLoops();
    state = "PauseMenu";
  } else if (lander.crashed) {
    menus.resetGameOver();
    state = "GameOverMenu";
  } else if (lander.landed) {
    menus.resetWin(lander.calculateScore());
    state = "WinMenu";
  }
}

function frame(time) {
  if (!running) return;
  if (!lastTime) lastTime = time;
  accumulator += Math.min(time - lastTime, 100);
  lastTime = time;

  while (accumulator >= STEP) {
    input.beginFrame();
    update();
    accumulator -= STEP;
  }
  draw();
  requestAnimationFrame(frame);
}

function update() {
  switch (state) {
    case "StartMenu": {
      const choice = menus.pollStart(input);
      if (choice === "Start Game") {
        menus.resetLevelSelect();
        state = "LevelSelectMenu";
      } else if (choice === "High Scores") {
        menus.resetHighScores();
        state = "HighScoresMenu";
      } else if (choice === "Quit") {
        state = "Thanks";
        thanksTimer = 120;
      }
      break;
    }
    case "HighScoresMenu":
      if (menus.pollHighScores(input)) {
        menus.resetStart();
        state = "StartMenu";
      }
      break;
    case "LevelSelectMenu": {
      const result = menus.pollLevelSelect(input);
      if (result.back) {
        menus.resetStart();
        state = "StartMenu";
      } else if (result.level) {
        startLevel(result.level);
      }
      break;
    }
    case "Game":
      updateGame();
      break;
    case "PauseMenu": {
      const choice = menus.pollPause(input);
      if (choice === "Resume") state = "Game";
      else if (choice === "Restart Level") startLevel(currentLevelName);
      else if (choice === "Main Menu") {
        menus.resetStart();
        state = "StartMenu";
      }
      break;
    }
    case "GameOverMenu": {
      const choice = menus.pollGameOver(input);
      if (choice === "Restart Level") startLevel(currentLevelName);
      else if (choice === "Main Menu") {
        menus.resetStart();
        state = "StartMenu";
      }
      break;
    }
    case "WinMenu": {
      const name = menus.pollWin(input);
      if (name) {
        saveScore(currentLevelName, name, lander.calculateScore());
        menus.resetLevelSelect();
        state = "LevelSelectMenu";
      }
      break;
    }
    case "Thanks":
      thanksTimer -= 1;
      if (thanksTimer <= 0 || input.pressed("a") || input.pressed("b") || input.pressed("start")) {
        menus.resetStart();
        state = "StartMenu";
      }
      break;
    default:
      state = "StartMenu";
  }
}

function draw() {
  ctx.clearRect(0, 0, 1280, 720);
  switch (state) {
    case "StartMenu":
      menus.drawStart(ctx);
      break;
    case "HighScoresMenu":
      menus.drawHighScores(ctx);
      break;
    case "LevelSelectMenu":
      menus.drawLevelSelect(ctx, levelCache);
      break;
    case "Game":
      drawGame(ctx, assets.images, lander, currentLevel.background, currentLevel.ground);
      break;
    case "PauseMenu":
      drawGame(ctx, assets.images, lander, currentLevel.background, currentLevel.ground);
      menus.drawPause(ctx);
      break;
    case "GameOverMenu":
      drawGame(ctx, assets.images, lander, currentLevel.background, currentLevel.ground);
      menus.drawGameOver(ctx);
      break;
    case "WinMenu":
      drawGame(ctx, assets.images, lander, currentLevel.background, currentLevel.ground);
      menus.drawWin(ctx);
      break;
    case "Thanks":
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, 1280, 720);
      ctx.drawImage(assets.images.logo, 290, 220);
      drawText(ctx, "Thanks for flying", 640, 460, 35, "#ff0000", "center");
      break;
  }
}

async function boot() {
  gate.querySelector("p").textContent = "Loading…";
  audioContext = new AudioContext();
  if (audioContext.state === "suspended") await audioContext.resume();
  assets = await loadAll(audioContext);
  landerAlpha = getAlphaData(assets.images.lander);
  await preloadLevels();
  audio = new AudioBus(audioContext, assets.sounds);
  menus = new Menus(assets.images, audio);
  input = new Input();
  lander = new Lander();
  gate.classList.add("hidden");
  running = true;
  requestAnimationFrame(frame);
}

function armGate() {
  const start = () => {
    gate.removeEventListener("click", start);
    window.removeEventListener("keydown", start);
    window.removeEventListener("gamepadconnected", start);
    boot().catch((error) => {
      gate.classList.remove("hidden");
      gate.querySelector("p").textContent = error.message;
    });
  };
  gate.addEventListener("click", start);
  window.addEventListener("keydown", start);
  window.addEventListener("gamepadconnected", start);
}

armGate();
