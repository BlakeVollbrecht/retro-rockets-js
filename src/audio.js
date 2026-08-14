export class AudioBus {
  constructor(context, sounds) {
    this.context = context;
    this.sounds = sounds;
    this.leftRocket = this.createLoop("rumble");
    this.rightRocket = this.createLoop("rumble");
    this.lowFuel = this.createLoop("lowFuel");
    this.playedCrash = false;
    this.playedWin = false;
  }

  createLoop(name) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.sounds[name];
    source.loop = true;
    gain.gain.value = 0;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
    return { source, gain };
  }

  play(name, volume = 1) {
    const source = this.context.createBufferSource();
    const gain = this.context.createGain();
    source.buffer = this.sounds[name];
    gain.gain.value = volume;
    source.connect(gain);
    gain.connect(this.context.destination);
    source.start();
  }

  setLoopVolume(loop, volume) {
    loop.gain.gain.value = Math.max(0, Math.min(1, volume));
  }

  resetGameCues() {
    this.playedCrash = false;
    this.playedWin = false;
    this.setLoopVolume(this.leftRocket, 0);
    this.setLoopVolume(this.rightRocket, 0);
    this.setLoopVolume(this.lowFuel, 0);
  }

  silenceLoops() {
    this.setLoopVolume(this.leftRocket, 0);
    this.setLoopVolume(this.rightRocket, 0);
    this.setLoopVolume(this.lowFuel, 0);
  }

  updateGame(lander) {
    if (lander.rightThrust > 0) {
      this.setLoopVolume(this.rightRocket, 0.3 + (0.7 * lander.rightThrust) / lander.triggerToThrust);
    } else {
      this.setLoopVolume(this.rightRocket, 0);
    }
    if (lander.leftThrust > 0) {
      this.setLoopVolume(this.leftRocket, 0.3 + (0.7 * lander.leftThrust) / lander.triggerToThrust);
    } else {
      this.setLoopVolume(this.leftRocket, 0);
    }

    if (lander.fuel < 0.2 * lander.startingFuel && !lander.crashed && !lander.landed) {
      this.setLoopVolume(this.lowFuel, 0.45);
    } else {
      this.setLoopVolume(this.lowFuel, 0);
    }

    if (lander.crashed && !this.playedCrash) {
      this.playedCrash = true;
      this.silenceLoops();
      this.play("crash", 0.9);
    }
    if (lander.landed && !this.playedWin) {
      this.playedWin = true;
      this.silenceLoops();
      this.play("win", 0.9);
    }
  }
}
