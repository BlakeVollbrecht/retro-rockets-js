import { drawText, textWidth } from "./render.js";
import { LEVELS } from "./levels.js";
import { scoresFor } from "./scores.js";

const FONT = 35;
const FONT_LARGE = 56;

export class Menus {
  constructor(images, audio) {
    this.images = images;
    this.audio = audio;
    this.startSelection = "Start Game";
    this.pauseSelection = "Resume";
    this.gameOverSelection = "Restart Level";
    this.levelIndex = 0;
    this.letterPositions = [0, 0, 0];
    this.letterSelection = 0;
    this.score = 0;
    this.highScoreLevel = 0;
  }

  resetStart() {
    this.startSelection = "Start Game";
  }

  resetPause() {
    this.pauseSelection = "Resume";
  }

  resetGameOver() {
    this.gameOverSelection = "Restart Level";
  }

  resetWin(score) {
    this.score = score;
    this.letterPositions = [0, 0, 0];
    this.letterSelection = 0;
  }

  resetLevelSelect() {
    this.levelIndex = 0;
  }

  resetHighScores() {
    this.highScoreLevel = 0;
  }

  moveVertical(input, items, current) {
    const index = items.indexOf(current);
    if (input.pressed("up")) {
      if (index <= 0) {
        this.audio.play("error", 0.5);
        return current;
      }
      this.audio.play("scroll", 0.5);
      return items[index - 1];
    }
    if (input.pressed("down")) {
      if (index >= items.length - 1) {
        this.audio.play("error", 0.5);
        return current;
      }
      this.audio.play("scroll", 0.5);
      return items[index + 1];
    }
    return current;
  }

  pollStart(input) {
    const items = ["Start Game", "High Scores", "Quit"];
    this.startSelection = this.moveVertical(input, items, this.startSelection);
    if (input.pressed("a") || input.pressed("start")) {
      if (this.startSelection !== "Quit") this.audio.play("click", 0.6);
      return this.startSelection;
    }
    return "";
  }

  drawStart(ctx) {
    ctx.drawImage(this.images.menuBackground, 0, 0);
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(this.images.logoBack, 290, 120);
    ctx.restore();
    ctx.drawImage(this.images.logo, 290, 120);
    const boxY = { "Start Game": 278, "High Scores": 349, Quit: 417 };
    ctx.drawImage(this.images.selectionBox, 294, boxY[this.startSelection]);
    drawText(ctx, "Start Game", 515, 350, FONT);
    drawText(ctx, "High Scores", 505, 420, FONT);
    drawText(ctx, "Quit", 588, 490, FONT);
  }

  pollLevelSelect(input) {
    if (input.pressed("b")) {
      this.audio.play("click", 0.6);
      return { back: true };
    }
    if (input.pressed("right")) {
      if (this.levelIndex === LEVELS.length - 1) this.audio.play("error", 0.5);
      else {
        this.levelIndex += 1;
        this.audio.play("scroll", 0.5);
      }
    } else if (input.pressed("left")) {
      if (this.levelIndex === 0) this.audio.play("error", 0.5);
      else {
        this.levelIndex -= 1;
        this.audio.play("scroll", 0.5);
      }
    } else if (input.pressed("a") || input.pressed("start")) {
      this.audio.play("click", 0.6);
      return { level: LEVELS[this.levelIndex].name };
    }
    return {};
  }

  drawLevelSelect(ctx, levelCache) {
    ctx.drawImage(this.images.menuBackground, 0, 0);
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(this.images.logoBack, 300, 520);
    ctx.drawImage(this.images.logoBack, 300, -10);
    ctx.restore();
    ctx.drawImage(this.images.buttonA, 990, 573);
    drawText(ctx, "Level Selection", 380, 40, FONT_LARGE);

    const level = LEVELS[this.levelIndex];
    const preview = levelCache[level.name];
    if (preview) {
      const scale = 0.5;
      const w = preview.ground.width * scale;
      const h = preview.ground.height * scale;
      ctx.drawImage(preview.background, 640 - w / 2, 370 - h / 2, w, h);
      ctx.drawImage(preview.ground, 640 - w / 2, 370 - h / 2, w, h);
    }
    const width = textWidth(ctx, level.name, FONT);
    drawText(ctx, level.name, 640 - width / 2, 617 - FONT / 2, FONT, "#ffffff");
  }

  pollHighScores(input) {
    if (input.pressed("right")) {
      if (this.highScoreLevel < LEVELS.length - 1) {
        this.highScoreLevel += 1;
        this.audio.play("scroll", 0.5);
      } else this.audio.play("error", 0.5);
    } else if (input.pressed("left")) {
      if (this.highScoreLevel > 0) {
        this.highScoreLevel -= 1;
        this.audio.play("scroll", 0.5);
      } else this.audio.play("error", 0.5);
    } else if (input.pressed("a") || input.pressed("start")) {
      this.audio.play("error", 0.5);
    } else if (input.pressed("b")) {
      this.audio.play("click", 0.6);
      return true;
    }
    return false;
  }

  drawHighScores(ctx) {
    ctx.drawImage(this.images.menuBackground, 0, 0);
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(this.images.logoBack, 300, 520);
    ctx.drawImage(this.images.logoBack, 300, -10);
    ctx.restore();
    ctx.drawImage(this.images.buttonB, 990, 573);
    drawText(ctx, "High Scores", 430, 40, FONT_LARGE);
    const level = LEVELS[this.highScoreLevel];
    drawText(ctx, level.name, 640, 150, FONT, "#ffffff", "center");
    const rows = scoresFor(level.name);
    if (rows.length === 0) {
      drawText(ctx, "No scores yet", 640, 280, FONT, "#ff6666", "center");
    } else {
      rows.forEach((row, index) => {
        drawText(ctx, `${index + 1}.  ${row.name}    ${row.score}`, 640, 230 + index * 42, FONT, "#ffffff", "center");
      });
    }
    drawText(ctx, "Press B to return to start menu", 300, 585, FONT, "#ffffff");
  }

  drawOverlay(ctx, title, selected, selectedYs, itemDraws) {
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(this.images.overlay, 312, 109);
    ctx.restore();
    drawText(ctx, title, 423, 135, FONT_LARGE);
    ctx.drawImage(this.images.selectionBox, 294, selectedYs[selected] ?? selectedYs[0]);
    itemDraws();
  }

  pollPause(input) {
    const items = ["Resume", "Restart Level", "Main Menu"];
    if (input.pressed("b") || input.pressed("start")) {
      this.audio.play("click", 0.6);
      return "Resume";
    }
    this.pauseSelection = this.moveVertical(input, items, this.pauseSelection);
    if (input.pressed("a")) {
      this.audio.play("click", 0.6);
      return this.pauseSelection;
    }
    return "";
  }

  drawPause(ctx) {
    const ys = { Resume: 278, "Restart Level": 349, "Main Menu": 417 };
    this.drawOverlay(ctx, "Pause Menu", this.pauseSelection, ys, () => {
      drawText(ctx, "Resume", 550, 350, FONT);
      drawText(ctx, "Restart Level", 497, 420, FONT);
      drawText(ctx, "Main Menu", 512, 490, FONT);
    });
  }

  pollGameOver(input) {
    const items = ["Restart Level", "Main Menu"];
    this.gameOverSelection = this.moveVertical(input, items, this.gameOverSelection);
    if (input.pressed("a") || input.pressed("start")) {
      this.audio.play("click", 0.6);
      return this.gameOverSelection;
    }
    return "";
  }

  drawGameOver(ctx) {
    const ys = { "Restart Level": 349, "Main Menu": 417 };
    this.drawOverlay(ctx, "Game Over", this.gameOverSelection, ys, () => {
      drawText(ctx, "Restart Level", 497, 420, FONT);
      drawText(ctx, "Main Menu", 512, 490, FONT);
    });
  }

  pollWin(input) {
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    if (input.pressed("a") || input.pressed("start")) {
      this.audio.play("click", 0.6);
      if (this.letterSelection < 2) this.letterSelection += 1;
      else {
        return (
          alphabet[this.letterPositions[0]] +
          alphabet[this.letterPositions[1]] +
          alphabet[this.letterPositions[2]]
        );
      }
    } else if (input.pressed("up")) {
      this.audio.play("scroll", 0.5);
      this.letterPositions[this.letterSelection] = (this.letterPositions[this.letterSelection] + 1) % 26;
    } else if (input.pressed("down")) {
      this.audio.play("scroll", 0.5);
      this.letterPositions[this.letterSelection] = (this.letterPositions[this.letterSelection] + 25) % 26;
    } else if (input.pressed("left")) {
      if (this.letterSelection === 0) this.audio.play("error", 0.5);
      else {
        this.letterSelection -= 1;
        this.audio.play("scroll", 0.5);
      }
    } else if (input.pressed("right")) {
      if (this.letterSelection === 2) this.audio.play("error", 0.5);
      else {
        this.letterSelection += 1;
        this.audio.play("scroll", 0.5);
      }
    }
    return "";
  }

  drawWin(ctx) {
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(this.images.overlay, 312, 109);
    ctx.restore();
    const xs = [500, 600, 700];
    ctx.drawImage(this.images.letterBox, xs[this.letterSelection], 450);
    drawText(ctx, "Safe Landing", 403, 135, FONT_LARGE);
    drawText(ctx, "Score:  " + this.score, 403, 250, FONT);
    drawText(ctx, "Enter Name:", 403, 360, FONT);
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    drawText(ctx, alphabet[this.letterPositions[0]], 515, 489, FONT);
    drawText(ctx, alphabet[this.letterPositions[1]], 615, 489, FONT);
    drawText(ctx, alphabet[this.letterPositions[2]], 715, 489, FONT);
  }
}
