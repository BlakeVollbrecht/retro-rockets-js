const FONT_FAMILY = '"Eras Demi ITC", sans-serif';
const KEY_FONT_FAMILY = "Oswald, sans-serif";

let keyFontLinked = false;

function ensureKeyFont() {
  if (keyFontLinked || typeof document === "undefined") return;
  keyFontLinked = true;
  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "https://fonts.googleapis.com/css2?family=Oswald:wght@500;600&display=swap";
  document.head.appendChild(link);
}

export function drawSprite(ctx, image, x, y, options = {}) {
  const {
    rotation = 0,
    originX = 0,
    originY = 0,
    scaleX = 1,
    scaleY = 1,
    flipX = false,
    alpha = 1,
  } = options;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(flipX ? -scaleX : scaleX, scaleY);
  ctx.globalAlpha = alpha;
  ctx.drawImage(image, -originX, -originY);
  ctx.restore();
}

export function drawText(ctx, text, x, y, size, color = "#ff0000", align = "left", baseline = "top") {
  ctx.save();
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawTextInkCenter(ctx, text, x, y, size, color = "#ff0000") {
  ctx.save();
  ctx.font = `${size}px ${FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = "center";
  ctx.textBaseline = "alphabetic";
  const metrics = ctx.measureText(text);
  const ascent = metrics.actualBoundingBoxAscent;
  const descent = metrics.actualBoundingBoxDescent;
  ctx.fillText(text, x, y + (ascent - descent) / 2);
  ctx.restore();
}

export function textWidth(ctx, text, size) {
  ctx.save();
  ctx.font = `${size}px ${FONT_FAMILY}`;
  const width = ctx.measureText(text).width;
  ctx.restore();
  return width;
}

export function drawKeyText(ctx, text, x, y, size, color = "#ffffff", align = "center", baseline = "top") {
  ensureKeyFont();
  ctx.save();
  ctx.font = `600 ${size}px ${KEY_FONT_FAMILY}`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
  ctx.restore();
}

export function drawKeyedHint(ctx, keys, rest, x, y, size, color = "#ffffff") {
  ensureKeyFont();
  const keyFont = `600 ${size}px ${KEY_FONT_FAMILY}`;
  const restFont = `${size}px ${FONT_FAMILY}`;
  ctx.save();
  ctx.fillStyle = color;
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.font = keyFont;
  const keyWidth = ctx.measureText(keys).width;
  ctx.font = restFont;
  const spaceWidth = ctx.measureText(" ").width;
  const restWidth = ctx.measureText(rest).width;
  let cursor = x - (keyWidth + spaceWidth + restWidth) / 2;
  ctx.font = keyFont;
  ctx.fillText(keys, cursor, y);
  cursor += keyWidth + spaceWidth;
  ctx.font = restFont;
  ctx.fillText(rest, cursor, y);
  ctx.restore();
}

export function drawGame(ctx, images, lander, background, ground) {
  ctx.drawImage(background, 0, 0);

  if (!lander.crashed && !lander.landed) {
    const invert = Math.random() > 0.5;
    const landerW = images.lander.width;
    const landerH = images.lander.height;
    drawSprite(
      ctx,
      images.fire,
      lander.position.x - (landerW * Math.cos(lander.rotation)) / 4,
      lander.position.y - (landerH * Math.sin(lander.rotation)) / 4,
      {
        rotation: lander.rotation - 0.04 + 0.08 * Math.random(),
        originX: images.fire.width / 2,
        originY: 0,
        scaleX: 0.3 + 0.1 * Math.random(),
        scaleY: lander.leftThrust / (3000 + 1000 * Math.random()),
        flipX: invert,
        alpha: (100 + Math.random() * 155) / 255,
      }
    );
    drawSprite(
      ctx,
      images.fire,
      lander.position.x + (landerW * Math.cos(lander.rotation)) / 4,
      lander.position.y + (landerH * Math.sin(lander.rotation)) / 4,
      {
        rotation: lander.rotation - 0.04 + 0.08 * Math.random(),
        originX: images.fire.width / 2,
        originY: 0,
        scaleX: 0.3 + 0.1 * Math.random(),
        scaleY: lander.rightThrust / (3000 + 1000 * Math.random()),
        flipX: invert,
        alpha: (170 + Math.random() * 85) / 255,
      }
    );
  }

  drawSprite(ctx, images.lander, lander.position.x, lander.position.y, {
    rotation: lander.rotation,
    originX: images.lander.width / 2,
    originY: images.lander.height / 2,
  });

  if (lander.crashed) {
    drawSprite(ctx, images.explosion, lander.position.x, lander.position.y, {
      originX: images.explosion.width / 2,
      originY: images.explosion.height / 1.8,
      scaleX: 2,
      scaleY: 2,
    });
  }

  ctx.drawImage(ground, 0, 0);

  const needleRotation = 5.65 + lander.fuel / 2000000;
  drawSprite(ctx, images.gauge, 1280, 30, {
    originX: images.gauge.width,
    originY: 0,
  });
  drawSprite(ctx, images.needle, 1310, 30 + images.gauge.height / 2, {
    rotation: needleRotation,
    originX: images.needle.width,
    originY: images.needle.height / 2,
  });
}
