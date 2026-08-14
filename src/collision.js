export function detectCollisions(lander, landerImage, landerAlpha, groundImage, groundAlpha) {
  lander.resetCollisions();

  const width = landerImage.width;
  const height = landerImage.height;
  const groundWidth = groundImage.width;
  const groundHeight = groundImage.height;
  const cos = Math.cos(lander.rotation);
  const sin = Math.sin(lander.rotation);

  const originX = -width / 2;
  const originY = -height / 2;
  let rowX = lander.position.x + originX * cos - originY * sin;
  let rowY = lander.position.y + originX * sin + originY * cos;
  const stepX = { x: cos, y: sin };
  const stepY = { x: -sin, y: cos };

  for (let yLander = 0; yLander < height; yLander++) {
    let posX = rowX;
    let posY = rowY;
    for (let xLander = 0; xLander < width; xLander++) {
      const xGround = Math.round(posX);
      const yGround = Math.round(posY);
      if (xGround >= 0 && xGround < groundWidth && yGround >= 0 && yGround < groundHeight) {
        const landerA = landerAlpha[(xLander + yLander * width) * 4 + 3];
        const groundA = groundAlpha[(xGround + yGround * groundWidth) * 4 + 3];
        if (landerA !== 0 && groundA !== 0) {
          if (yLander < height - 15) lander.bodyCollision = true;
          if (yLander > height - 3 && xLander < 5 && xLander > 3) lander.leftFootBottomCollision = true;
          if (yLander > height - 3 && xLander > width - 5 && xLander < width - 3) {
            lander.rightFootBottomCollision = true;
          }
          if (yLander > height - 3 && xLander === 0) lander.leftFootSideCollision = true;
          if (yLander > height - 3 && xLander === width - 1) lander.rightFootSideCollision = true;
        }
      }
      posX += stepX.x;
      posY += stepX.y;
    }
    rowX += stepY.x;
    rowY += stepY.y;
  }
}
