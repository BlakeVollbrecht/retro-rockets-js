import { loadImages, loadSounds, loadImage, getAlphaData } from "./assets.js";
import { Input } from "./input.js";
import { Lander } from "./lander.js";
import { detectCollisions } from "./collision.js";
import { AudioBus } from "./audio.js";
import { drawGame } from "./render.js";
import { Menus } from "./menus.js";
import { LEVELS, getLevel } from "./levels.js";
import { saveScore } from "./scores.js";

const STEP = 1000 / 60;

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");

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
let flightHintActive = false;
let flightHintArmed = true;

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
  if (flightHintArmed) {
    flightHintActive = true;
    flightHintArmed = false;
  }
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
    input.stopRumble();
    state = "PauseMenu";
  } else if (lander.crashed) {
    input.rumble(1, 1, 280);
    menus.resetGameOver();
    state = "GameOverMenu";
  } else if (lander.landed) {
    input.rumble(0.25, 0.4, 180);
    menus.resetWin(lander.calculateScore());
    state = "WinMenu";
  } else {
    const left = lander.leftThrust / lander.triggerToThrust;
    const right = lander.rightThrust / lander.triggerToThrust;
    if (left > 0.02 || right > 0.02) input.rumble(left * 0.45, right * 0.55, 80);
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
  if (audioContext && audioContext.state === "suspended") {
    audioContext.resume();
  }
  if (audio) audio.ensureLoops();
  switch (state) {
    case "StartMenu": {
      const choice = menus.pollStart(input);
      if (choice === "Start Game") {
        state = "LevelSelectMenu";
      } else if (choice === "High Scores") {
        menus.resetHighScores();
        state = "HighScoresMenu";
      } else if (choice === "Controls") {
        state = "ControlsMenu";
      }
      break;
    }
    case "HighScoresMenu":
      if (menus.pollHighScores(input)) {
        state = "StartMenu";
      }
      break;
    case "ControlsMenu":
      if (menus.pollControls(input)) {
        state = "StartMenu";
      }
      break;
    case "LevelSelectMenu": {
      const result = menus.pollLevelSelect(input);
      if (result.back) {
        state = "StartMenu";
      } else if (result.level) {
        startLevel(result.level);
      }
      break;
    }
    case "Game":
      if (flightHintActive) {
        if (input.pressed("a") || input.pressed("start")) {
          audio.play("click", 0.6);
          flightHintActive = false;
        }
      } else {
        updateGame();
      }
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
        state = "LevelSelectMenu";
      }
      break;
    }
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
    case "ControlsMenu":
      menus.drawControls(ctx);
      break;
    case "LevelSelectMenu":
      menus.drawLevelSelect(ctx, levelCache);
      break;
    case "Game":
      drawGame(ctx, assets.images, lander, currentLevel.background, currentLevel.ground);
      if (flightHintActive) menus.drawFlightHint(ctx);
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
  }
}

function showLoading(message = "loading") {
  ctx.fillStyle = "#000";
  ctx.fillRect(0, 0, 1280, 720);
  ctx.fillStyle = "rgba(255, 255, 255, 0.35)";
  ctx.font = "18px \"Eras Demi ITC\", sans-serif";
  ctx.textAlign = "left";
  ctx.textBaseline = "alphabetic";
  ctx.fillText(message, 28, 688);
}

async function boot() {
  showLoading();
  if (document.fonts?.load) {
    await document.fonts.load('35px "Eras Demi ITC"').catch(() => {});
  }
  audioContext = new AudioContext();
  const images = await loadImages();
  landerAlpha = getAlphaData(images.lander);
  await preloadLevels();
  let sounds = {};
  try {
    sounds = await loadSounds(audioContext);
  } catch (error) {
    console.warn(error);
  }
  assets = { images, sounds };
  audio = new AudioBus(audioContext, sounds);
  menus = new Menus(images, audio);
  input = new Input();
  lander = new Lander();
  running = true;
  requestAnimationFrame(frame);
}

boot().catch((error) => {
  showLoading(error.message);
});
