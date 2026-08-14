export const LEVELS = [
  {
    name: "Mars - Cliff",
    gravity: 1.0,
    friction: 0.005,
    ground: "Game/Images/Grounds/Mars01Ground.png",
    background: "Game/Images/Backgrounds/MarsBackground.png",
  },
  {
    name: "Mars - Mountain",
    gravity: 1.0,
    friction: 0.005,
    ground: "Game/Images/Grounds/Mars02Ground.png",
    background: "Game/Images/Backgrounds/MarsBackground.png",
  },
  {
    name: "Mars - Boulder Field",
    gravity: 1.0,
    friction: 0.005,
    ground: "Game/Images/Grounds/Mars03Ground.png",
    background: "Game/Images/Backgrounds/MarsBackground.png",
  },
  {
    name: "Moon - Overhang",
    gravity: 0.5,
    friction: 0.005,
    ground: "Game/Images/Grounds/Moon01Ground.png",
    background: "Game/Images/Backgrounds/MoonBackground.png",
  },
  {
    name: "Moon - Crater",
    gravity: 0.5,
    friction: 0.005,
    ground: "Game/Images/Grounds/Moon02Ground.png",
    background: "Game/Images/Backgrounds/MoonBackground.png",
  },
  {
    name: "New Planet - Slope",
    gravity: 1.5,
    friction: 0.01,
    ground: "Game/Images/Grounds/NewPlanet01Ground.png",
    background: "Game/Images/Backgrounds/NewPlanetBackground.png",
  },
  {
    name: "New Planet - Uneven",
    gravity: 1.5,
    friction: 0.01,
    ground: "Game/Images/Grounds/NewPlanet02Ground.png",
    background: "Game/Images/Backgrounds/NewPlanetBackground.png",
  },
  {
    name: "New Planet - Flying Land",
    gravity: 1.5,
    friction: 0.01,
    ground: "Game/Images/Grounds/NewPlanet03Ground.png",
    background: "Game/Images/Backgrounds/NewPlanetBackground.png",
  },
];

export function getLevel(name) {
  return LEVELS.find((level) => level.name === name);
}
