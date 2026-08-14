import { drawText, drawTextInkCenter } from "./render.js";
import { LEVELS } from "./levels.js";
import { scoresFor, loadLastName } from "./scores.js";

const FONT = 35;
const FONT_LARGE = 56;
const QUIT_NOTICE_FRAMES = 120;
const CENTER_X = 640;
// Visible red outline inside selectionBox.png; the rest of the texture is empty.
const SELECT_INSET = { x: 188, y: 60, w: 314, h: 81 };
// Opaque region of logoBack.png; used to center titles in the contrast bars.
const LOGO_BACK_VISUAL = { x: 19, y: 52, w: 660, h: 87 };
const HEADER_BAR_Y = -10;
const BOTTOM_BAR_Y = 520;

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
    this.quitNoticeFrames = 0;
  }

  resetStart() {
    this.startSelection = "Start Game";
    this.quitNoticeFrames = 0;
  }

  resetPause() {
    this.pauseSelection = "Resume";
  }

  resetGameOver() {
    this.gameOverSelection = "Restart Level";
  }

  resetWin(score) {
    this.score = score;
    this.letterPositions = [...loadLastName()].map((ch) => ch.charCodeAt(0) - 65);
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

  drawSelectionBox(ctx, textY) {
    const img = this.images.selectionBox;
    const midX = SELECT_INSET.x + SELECT_INSET.w / 2;
    const midY = SELECT_INSET.y + SELECT_INSET.h / 2;
    ctx.drawImage(img, CENTER_X - midX, textY + FONT / 2 - midY);
  }

  drawScrollChevrons(ctx, y, index, count) {
    const drawOne = (x, dir, enabled) => {
      ctx.save();
      ctx.fillStyle = enabled ? "#ffffff" : "rgba(255, 255, 255, 0.22)";
      ctx.beginPath();
      const w = 16;
      const h = 26;
      if (dir < 0) {
        ctx.moveTo(x - w, y);
        ctx.lineTo(x + 7, y - h / 2);
        ctx.lineTo(x + 7, y + h / 2);
      } else {
        ctx.moveTo(x + w, y);
        ctx.lineTo(x - 7, y - h / 2);
        ctx.lineTo(x - 7, y + h / 2);
      }
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    };
    drawOne(260, -1, index > 0);
    drawOne(1020, 1, index < count - 1);
  }

  drawMenuChrome(ctx, title, button) {
    const img = this.images.logoBack;
    const vis = LOGO_BACK_VISUAL;
    const x = CENTER_X - (vis.x + vis.w / 2);
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(img, x, HEADER_BAR_Y);
    ctx.drawImage(img, x, BOTTOM_BAR_Y);
    ctx.restore();

    const headerCy = HEADER_BAR_Y + vis.y + vis.h / 2;
    drawText(ctx, title, CENTER_X, headerCy, FONT_LARGE, "#ff0000", "center", "middle");

    const bottomBarCy = BOTTOM_BAR_Y + vis.y + vis.h / 2;
    const buttonImg = button === "A" ? this.images.buttonA : this.images.buttonB;
    ctx.drawImage(buttonImg, 990, bottomBarCy - buttonImg.height / 2);
    return { bottomBarCy, bottomBarTextX: x + vis.x + 16 };
  }

  pollStart(input) {
    if (this.quitNoticeFrames > 0) this.quitNoticeFrames -= 1;
    const items = ["Start Game", "High Scores", "Controls", "Quit"];
    this.startSelection = this.moveVertical(input, items, this.startSelection);
    if (input.pressed("a") || input.pressed("start")) {
      if (this.startSelection === "Quit") {
        this.audio.play("error", 0.5);
        this.quitNoticeFrames = QUIT_NOTICE_FRAMES;
        return "";
      }
      this.audio.play("click", 0.6);
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
    const itemY = { "Start Game": 350, "High Scores": 420, Controls: 490, Quit: 560 };
    this.drawSelectionBox(ctx, itemY[this.startSelection]);
    drawText(ctx, "Start Game", CENTER_X, 350, FONT, "#ff0000", "center");
    drawText(ctx, "High Scores", CENTER_X, 420, FONT, "#ff0000", "center");
    drawText(ctx, "Controls", CENTER_X, 490, FONT, "#ff0000", "center");
    drawText(ctx, "Quit", CENTER_X, 560, FONT, "#ff0000", "center");

    if (this.quitNoticeFrames > 0) {
      drawText(ctx, "no longer implemented", CENTER_X, 668, FONT, "#ffffff", "center");
    }
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
    const { bottomBarCy } = this.drawMenuChrome(ctx, "Level Selection", "A");

    const level = LEVELS[this.levelIndex];
    const preview = levelCache[level.name];
    if (preview) {
      const scale = 0.5;
      const w = preview.ground.width * scale;
      const h = preview.ground.height * scale;
      ctx.drawImage(preview.background, CENTER_X - w / 2, 370 - h / 2, w, h);
      ctx.drawImage(preview.ground, CENTER_X - w / 2, 370 - h / 2, w, h);
    }
    this.drawScrollChevrons(ctx, 370, this.levelIndex, LEVELS.length);
    drawText(ctx, level.name, CENTER_X, bottomBarCy, FONT, "#ffffff", "center", "middle");
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
    const { bottomBarCy, bottomBarTextX } = this.drawMenuChrome(ctx, "High Scores", "B");
    const level = LEVELS[this.highScoreLevel];
    drawText(ctx, level.name, CENTER_X, 150, FONT, "#ffffff", "center");
    this.drawScrollChevrons(ctx, 167, this.highScoreLevel, LEVELS.length);
    const rows = scoresFor(level.name);
    if (rows.length === 0) {
      drawText(ctx, "No scores yet", CENTER_X, 280, FONT, "#ff6666", "center");
    } else {
      rows.forEach((row, index) => {
        drawText(ctx, `${index + 1}.  ${row.name}    ${row.score}`, CENTER_X, 230 + index * 42, FONT, "#ffffff", "center");
      });
    }
    drawText(ctx, "Press B to return to start menu", bottomBarTextX, bottomBarCy, FONT, "#ffffff", "left", "middle");
  }

  pollControls(input) {
    if (input.pressed("b")) {
      this.audio.play("click", 0.6);
      return true;
    }
    if (input.pressed("a") || input.pressed("start")) {
      this.audio.play("error", 0.5);
    }
    return false;
  }

  drawControls(ctx) {
    ctx.drawImage(this.images.menuBackground, 0, 0);
    const { bottomBarCy, bottomBarTextX } = this.drawMenuChrome(ctx, "Controls", "B");

    const vis = LOGO_BACK_VISUAL;
    const tableTop = 175;
    const tableBottom = 175 + 5 * 48 + 24;
    const padY = 28;
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(
      this.images.logoBack,
      vis.x,
      vis.y,
      vis.w,
      vis.h,
      140,
      tableTop - padY,
      1000,
      tableBottom + padY - (tableTop - padY)
    );
    ctx.restore();

    const rows = [
      { action: "Action", xbox: "Xbox", keyboard: "Keyboard", header: true },
      { action: "Thrust", xbox: "Left / Right Trigger", keyboard: "Q / E" },
      { action: "Select", xboxIcon: "buttonA", keyboard: "Enter" },
      { action: "Back", xboxIcon: "buttonB", keyboard: "Esc" },
      { action: "Pause", xbox: "Start", keyboard: "P" },
      { action: "Move", xbox: "D-pad / Left Stick", keyboard: "Arrows / WASD" },
    ];
    const colX = [307, 640, 973];
    const iconSize = 36;
    rows.forEach((row, index) => {
      const y = 175 + index * 48;
      const color = row.header ? "#ff0000" : "#ffffff";
      const size = row.header ? 28 : 24;
      drawText(ctx, row.action, colX[0], y, size, color, "center");
      if (row.xboxIcon) {
        const icon = this.images[row.xboxIcon];
        ctx.drawImage(
          icon,
          colX[1] - iconSize / 2,
          y + size / 2 - iconSize / 2,
          iconSize,
          iconSize
        );
      } else {
        drawText(ctx, row.xbox, colX[1], y, size, color, "center");
      }
      drawText(ctx, row.keyboard, colX[2], y, size, color, "center");
    });
    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(180, 214);
    ctx.lineTo(1100, 214);
    ctx.stroke();
    ctx.restore();

    drawText(ctx, "Press B to return to start menu", bottomBarTextX, bottomBarCy, FONT, "#ffffff", "left", "middle");
  }

  drawOverlay(ctx, title, selected, itemYs, itemDraws) {
    ctx.save();
    ctx.globalAlpha = 170 / 255;
    ctx.drawImage(
      this.images.overlay,
      CENTER_X - this.images.overlay.width / 2,
      109
    );
    ctx.restore();
    drawText(ctx, title, CENTER_X, 135, FONT_LARGE, "#ff0000", "center");
    this.drawSelectionBox(ctx, itemYs[selected] ?? Object.values(itemYs)[0]);
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
    const ys = { Resume: 350, "Restart Level": 420, "Main Menu": 490 };
    this.drawOverlay(ctx, "Pause Menu", this.pauseSelection, ys, () => {
      drawText(ctx, "Resume", CENTER_X, 350, FONT, "#ff0000", "center");
      drawText(ctx, "Restart Level", CENTER_X, 420, FONT, "#ff0000", "center");
      drawText(ctx, "Main Menu", CENTER_X, 490, FONT, "#ff0000", "center");
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
    const ys = { "Restart Level": 420, "Main Menu": 490 };
    this.drawOverlay(ctx, "Game Over", this.gameOverSelection, ys, () => {
      drawText(ctx, "Restart Level", CENTER_X, 420, FONT, "#ff0000", "center");
      drawText(ctx, "Main Menu", CENTER_X, 490, FONT, "#ff0000", "center");
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
    ctx.drawImage(
      this.images.overlay,
      CENTER_X - this.images.overlay.width / 2,
      109
    );
    ctx.restore();
    drawText(ctx, "Safe Landing", CENTER_X, 135, FONT_LARGE, "#ff0000", "center");
    drawText(ctx, "Score:  " + this.score, CENTER_X, 250, FONT, "#ff0000", "center");
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const box = this.images.letterBox;
    const gap = 12;
    const startX = CENTER_X - (box.width * 3 + gap * 2) / 2;
    const overlayBottom = 109 + this.images.overlay.height;
    const groupH = FONT + 18 + box.height;
    const groupTop = (250 + FONT + overlayBottom - groupH) / 2;
    drawText(ctx, "Enter Name:", CENTER_X, groupTop, FONT, "#ff0000", "center");
    const boxY = groupTop + FONT + 18;
    const slotX = 3 + 68 / 2;
    const slotY = 28 + 76 / 2;
    ctx.drawImage(box, startX + this.letterSelection * (box.width + gap), boxY);
    for (let i = 0; i < 3; i += 1) {
      const bx = startX + i * (box.width + gap);
      drawTextInkCenter(
        ctx,
        alphabet[this.letterPositions[i]],
        bx + slotX,
        boxY + slotY,
        FONT
      );
    }
  }
}
