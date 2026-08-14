export function contentUrl(path) {
  return "content/" + path.split("/").map(encodeURIComponent).join("/");
}

const IMAGE_PATHS = {
  menuBackground: "Menu/Images/background.jpg",
  logo: "Menu/Images/logo.png",
  logoBack: "Menu/Images/logoBack.png",
  selectionBox: "Menu/Images/selectionBox.png",
  overlay: "Menu/Images/OverlayMenuBack.png",
  letterBox: "Menu/Images/LetterSelectBox.png",
  buttonA: "Menu/Images/xboxControllerButtonA.png",
  buttonB: "Menu/Images/xboxControllerButtonB.png",
  lander: "Game/Images/Lander.png",
  fire: "Game/Images/fire.png",
  explosion: "Game/Images/explosion.png",
  gauge: "Game/Images/guage.png",
  needle: "Game/Images/needle.png",
};

const SOUND_PATHS = {
  scroll: "Menu/Sounds/dragonAgeClick.wav",
  click: "Menu/Sounds/ventriloClick.wav",
  error: "Menu/Sounds/err.wav",
  rumble: "Game/Sounds/Rumble Loop.wav",
  crash: "Game/Sounds/Explosion.wav",
  lowFuel: "Game/Sounds/Warning Beep.wav",
  win: "Game/Sounds/win sound.wav",
};

export function loadImage(path) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Failed to load image " + path));
    img.src = contentUrl(path);
  });
}

export function loadAudioBuffer(context, path) {
  return fetch(contentUrl(path))
    .then((res) => {
      if (!res.ok) throw new Error("Failed to load audio " + path);
      return res.arrayBuffer();
    })
    .then((data) => context.decodeAudioData(data.slice(0)));
}

export function getAlphaData(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.width;
  canvas.height = image.height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  return ctx.getImageData(0, 0, image.width, image.height).data;
}

export async function loadImages() {
  const images = {};
  await Promise.all(
    Object.entries(IMAGE_PATHS).map(async ([key, path]) => {
      images[key] = await loadImage(path);
    })
  );
  return images;
}

export async function loadSounds(audioContext) {
  const sounds = {};
  await Promise.all(
    Object.entries(SOUND_PATHS).map(async ([key, path]) => {
      try {
        sounds[key] = await loadAudioBuffer(audioContext, path);
      } catch (error) {
        console.warn(error);
      }
    })
  );
  return sounds;
}
