const STICK_THRESHOLD = 0.3;
const TRIGGER_THRESHOLD = 0.15;
const KEY_RAMP = 1 / 9;

function emptyButtons() {
  return {
    a: false,
    b: false,
    start: false,
    up: false,
    down: false,
    left: false,
    right: false,
    leftTrigger: 0,
    rightTrigger: 0,
  };
}

function emptyActivity() {
  return {
    a: false,
    b: false,
    start: false,
    up: false,
    down: false,
    left: false,
    right: false,
    leftTrigger: false,
    rightTrigger: false,
  };
}

function padActivity(pad) {
  return {
    a: pad.a,
    b: pad.b,
    start: pad.start,
    up: pad.up,
    down: pad.down,
    left: pad.left,
    right: pad.right,
    leftTrigger: pad.leftTrigger > TRIGGER_THRESHOLD,
    rightTrigger: pad.rightTrigger > TRIGGER_THRESHOLD,
  };
}

function anyActive(activity) {
  return Object.values(activity).some(Boolean);
}

function anyNew(current, previous) {
  return Object.keys(current).some((name) => current[name] && !previous[name]);
}

function approach(current, target, step) {
  if (current < target) return Math.min(target, current + step);
  if (current > target) return Math.max(target, current - step);
  return current;
}

export class Input {
  constructor() {
    this.current = emptyButtons();
    this.previous = emptyButtons();
    this.keys = new Set();
    this.padAllowed = false;
    this.padIndex = null;
    this.leftKeyThrust = 0;
    this.rightKeyThrust = 0;
    this.lastDevice = "keyboard";
    this.prevKeys = new Set();
    this.prevPadActivity = emptyActivity();

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.keys.clear());
  }

  enablePad() {
    this.padAllowed = true;
  }

  pressed(name) {
    return this.current[name] && !this.previous[name];
  }

  beginFrame() {
    this.previous = this.current;
    this.current = emptyButtons();

    const pad = this.readPad();
    const keys = this.keys;
    this.trackDevice(pad, keys);

    this.current.a = pad.a || keys.has("Enter") || keys.has("KeyZ");
    this.current.b = pad.b || keys.has("Escape") || keys.has("Backspace") || keys.has("KeyX");
    this.current.start = pad.start || keys.has("KeyP") || keys.has("ShiftRight");
    this.current.up = pad.up || keys.has("ArrowUp") || keys.has("KeyW");
    this.current.down = pad.down || keys.has("ArrowDown") || keys.has("KeyS");
    this.current.left = pad.left || keys.has("ArrowLeft") || keys.has("KeyA");
    this.current.right = pad.right || keys.has("ArrowRight") || keys.has("KeyD");

    const leftKey = keys.has("KeyQ") || keys.has("ShiftLeft") || keys.has("ControlLeft");
    const rightKey = keys.has("KeyE") || keys.has("Space") || keys.has("ControlRight");
    this.leftKeyThrust = approach(this.leftKeyThrust, leftKey ? 1 : 0, KEY_RAMP);
    this.rightKeyThrust = approach(this.rightKeyThrust, rightKey ? 1 : 0, KEY_RAMP);
    this.current.leftTrigger = Math.max(pad.leftTrigger, this.leftKeyThrust);
    this.current.rightTrigger = Math.max(pad.rightTrigger, this.rightKeyThrust);
  }

  trackDevice(pad, keys) {
    const activity = padActivity(pad);
    const keyActive = keys.size > 0;
    const padActive = anyActive(activity);
    const newKey = [...keys].some((code) => !this.prevKeys.has(code));
    const newPad = anyNew(activity, this.prevPadActivity);

    if (newKey) this.lastDevice = "keyboard";
    else if (newPad) this.lastDevice = "gamepad";
    else if (keyActive !== padActive) this.lastDevice = keyActive ? "keyboard" : "gamepad";

    this.prevKeys = new Set(keys);
    this.prevPadActivity = activity;
  }

  getPad() {
    if (!this.padAllowed || document.visibilityState !== "visible") return null;
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    if (this.padIndex != null && pads[this.padIndex]) return pads[this.padIndex];
    const pad = [...pads].find(Boolean) || null;
    if (pad) this.padIndex = pad.index;
    return pad;
  }

  rumble(strong, weak, ms) {
    const actuator = this.getPad()?.vibrationActuator;
    if (!actuator || typeof actuator.playEffect !== "function") return;
    actuator
      .playEffect("dual-rumble", {
        startDelay: 0,
        duration: ms,
        strongMagnitude: Math.max(0, Math.min(1, strong)),
        weakMagnitude: Math.max(0, Math.min(1, weak)),
      })
      .catch(() => {});
  }

  stopRumble() {
    const actuator = this.getPad()?.vibrationActuator;
    if (actuator && typeof actuator.reset === "function") {
      actuator.reset().catch(() => {});
    }
  }

  readPad() {
    const buttons = emptyButtons();
    const pad = this.getPad();
    if (!pad) return buttons;

    const b = pad.buttons;
    const axes = pad.axes;
    const value = (index) => (b[index] ? b[index].value : 0);
    const down = (index) => value(index) > 0.5;

    buttons.a = down(0);
    buttons.b = down(1);
    buttons.start = down(9);
    buttons.up = down(12) || (axes[1] ?? 0) < -STICK_THRESHOLD;
    buttons.down = down(13) || (axes[1] ?? 0) > STICK_THRESHOLD;
    buttons.left = down(14) || (axes[0] ?? 0) < -STICK_THRESHOLD;
    buttons.right = down(15) || (axes[0] ?? 0) > STICK_THRESHOLD;
    buttons.leftTrigger = b[6] ? b[6].value : 0;
    buttons.rightTrigger = b[7] ? b[7].value : 0;
    return buttons;
  }
}
