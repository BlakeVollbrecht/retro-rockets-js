const STICK_THRESHOLD = 0.3;

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

export class Input {
  constructor() {
    this.current = emptyButtons();
    this.previous = emptyButtons();
    this.keys = new Set();
    this.padIndex = null;

    window.addEventListener("keydown", (event) => {
      this.keys.add(event.code);
      if (["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener("keyup", (event) => this.keys.delete(event.code));
    window.addEventListener("blur", () => this.keys.clear());
    window.addEventListener("gamepadconnected", (event) => {
      this.padIndex = event.gamepad.index;
    });
    window.addEventListener("gamepaddisconnected", () => {
      this.padIndex = null;
    });
  }

  pressed(name) {
    return this.current[name] && !this.previous[name];
  }

  beginFrame() {
    this.previous = this.current;
    this.current = emptyButtons();

    const pad = this.readPad();
    const keys = this.keys;

    this.current.a = pad.a || keys.has("Enter") || keys.has("KeyZ");
    this.current.b = pad.b || keys.has("Escape") || keys.has("Backspace") || keys.has("KeyX");
    this.current.start = pad.start || keys.has("KeyP") || keys.has("ShiftRight");
    this.current.up = pad.up || keys.has("ArrowUp") || keys.has("KeyW");
    this.current.down = pad.down || keys.has("ArrowDown") || keys.has("KeyS");
    this.current.left = pad.left || keys.has("ArrowLeft") || keys.has("KeyA");
    this.current.right = pad.right || keys.has("ArrowRight") || keys.has("KeyD");

    const leftKey = keys.has("KeyQ") || keys.has("ShiftLeft") || keys.has("ControlLeft");
    const rightKey = keys.has("KeyE") || keys.has("Space") || keys.has("ControlRight");
    this.current.leftTrigger = Math.max(pad.leftTrigger, leftKey ? 1 : 0);
    this.current.rightTrigger = Math.max(pad.rightTrigger, rightKey ? 1 : 0);
  }

  readPad() {
    const buttons = emptyButtons();
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let pad = null;
    if (this.padIndex != null && pads[this.padIndex]) {
      pad = pads[this.padIndex];
    } else {
      pad = [...pads].find(Boolean) || null;
      if (pad) this.padIndex = pad.index;
    }
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
