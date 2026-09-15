const STICK_THRESHOLD = 0.3;
const TRIGGER_THRESHOLD = 0.15;
const KEY_RAMP = 1 / 9;

// Standard Gamepad mapping (https://w3c.github.io/gamepad/#remapping).
// Xbox pads report mapping === "standard" in Chromium and Firefox.
const BTN = { a: 0, b: 1, lt: 6, rt: 7, start: 9, up: 12, down: 13, left: 14, right: 15 };
const AXIS = { leftX: 0, leftY: 1 };

// One rumble effect at a time; refresh it only when it is about to end or the
// requested strength changes noticeably. Sending a new effect every physics
// tick floods the pad with haptic reports.
const RUMBLE_REFRESH_MS = 60;
const RUMBLE_DELTA = 0.1;

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

function clamp01(value) {
  return Math.max(0, Math.min(1, value));
}

function readGamepads() {
  if (typeof navigator.getGamepads !== "function") return [];
  try {
    // Browsers pad the array with null for empty slots.
    return Array.from(navigator.getGamepads() || []);
  } catch {
    return [];
  }
}

export class Input {
  constructor() {
    this.current = emptyButtons();
    this.previous = emptyButtons();
    this.keys = new Set();
    this.padIndex = null;
    this.padId = "";
    this.padButtons = emptyButtons();
    this.padActive = false;
    this.leftKeyThrust = 0;
    this.rightKeyThrust = 0;
    this.lastDevice = "keyboard";
    this.prevKeys = new Set();
    this.prevPadActivity = emptyActivity();
    this.rumbleUntil = 0;
    this.rumbleStrong = 0;
    this.rumbleWeak = 0;

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.keys.clear());

    // The browser only fires gamepadconnected after a button has been pressed
    // on the pad while the page is open (user activation for gamepads).
    window.addEventListener("gamepadconnected", (event) => this.adoptPad(event.gamepad));
    window.addEventListener("gamepaddisconnected", (event) => {
      if (event.gamepad && event.gamepad.index === this.padIndex) {
        console.info(`gamepad disconnected: ${event.gamepad.id}`);
        this.padIndex = null;
        this.padId = "";
        this.padButtons = emptyButtons();
        this.rumbleUntil = 0;
      }
    });
  }

  get padConnected() {
    return this.padIndex != null;
  }

  adoptPad(gamepad) {
    if (!gamepad || this.padIndex != null) return;
    this.padIndex = gamepad.index;
    this.padId = gamepad.id;
    console.info(`gamepad connected: ${gamepad.id} (mapping: ${gamepad.mapping || "none"})`);
  }

  pressed(name) {
    return this.current[name] && !this.previous[name];
  }

  // Call once per animation frame. Reads the gamepad state snapshot that every
  // fixed simulation step in that frame will consume.
  poll() {
    const pads = readGamepads();
    let pad = this.padIndex != null ? pads[this.padIndex] : null;
    if (!pad || pad.connected === false) {
      // Some browsers expose a pad on the first getGamepads() read without
      // firing gamepadconnected; pick up the first live one.
      this.padIndex = null;
      pad = pads.find((candidate) => candidate && candidate.connected !== false) || null;
      if (pad) this.adoptPad(pad);
    }
    this.padButtons = pad ? this.mapPad(pad) : emptyButtons();
    this.padActive = anyActive(padActivity(this.padButtons));
  }

  mapPad(pad) {
    const buttons = emptyButtons();
    const b = pad.buttons || [];
    const axes = pad.axes || [];
    const value = (index) => (b[index] ? b[index].value : 0);
    const down = (index) => Boolean(b[index] && (b[index].pressed || b[index].value > 0.5));
    const axis = (index) => (typeof axes[index] === "number" ? axes[index] : 0);

    buttons.a = down(BTN.a);
    buttons.b = down(BTN.b);
    buttons.start = down(BTN.start);
    buttons.up = down(BTN.up) || axis(AXIS.leftY) < -STICK_THRESHOLD;
    buttons.down = down(BTN.down) || axis(AXIS.leftY) > STICK_THRESHOLD;
    buttons.left = down(BTN.left) || axis(AXIS.leftX) < -STICK_THRESHOLD;
    buttons.right = down(BTN.right) || axis(AXIS.leftX) > STICK_THRESHOLD;
    buttons.leftTrigger = clamp01(value(BTN.lt));
    buttons.rightTrigger = clamp01(value(BTN.rt));
    return buttons;
  }

  beginFrame() {
    this.previous = this.current;
    this.current = emptyButtons();

    const pad = this.padButtons;
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

  actuator() {
    if (this.padIndex == null) return null;
    const pad = readGamepads()[this.padIndex];
    const actuator = pad?.vibrationActuator;
    if (!actuator || typeof actuator.playEffect !== "function") return null;
    if (typeof actuator.canPlayEffectType === "function" && !actuator.canPlayEffectType("dual-rumble")) {
      return null;
    }
    return actuator;
  }

  rumble(strong, weak, ms) {
    strong = clamp01(strong);
    weak = clamp01(weak);
    const now = performance.now();
    const active = now < this.rumbleUntil;
    const changed =
      Math.abs(strong - this.rumbleStrong) > RUMBLE_DELTA || Math.abs(weak - this.rumbleWeak) > RUMBLE_DELTA;
    if (active && !changed && this.rumbleUntil - now > RUMBLE_REFRESH_MS) return;

    const actuator = this.actuator();
    if (!actuator) return;
    this.rumbleUntil = now + ms;
    this.rumbleStrong = strong;
    this.rumbleWeak = weak;
    actuator
      .playEffect("dual-rumble", {
        startDelay: 0,
        duration: ms,
        strongMagnitude: strong,
        weakMagnitude: weak,
      })
      .catch(() => {});
  }

  stopRumble() {
    const wasActive = performance.now() < this.rumbleUntil;
    this.rumbleUntil = 0;
    this.rumbleStrong = 0;
    this.rumbleWeak = 0;
    if (!wasActive) return;
    const actuator = this.actuator();
    if (actuator && typeof actuator.reset === "function") {
      actuator.reset().catch(() => {});
    }
  }
}
