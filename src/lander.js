export class Lander {
  constructor() {
    this.mass = 1000;
    this.startingFuel = 2500000;
    this.radius = 100;
    this.triggerToThrust = 1500;
    this.crashVelocity = 0.5;
    this.reset(1, 0.005);
  }

  reset(gravity, friction) {
    this.gravity = gravity;
    this.friction = friction;
    this.fuel = this.startingFuel;
    this.position = { x: 640, y: 150 };
    this.velocity = { x: 0, y: 0 };
    this.rotation = 0;
    this.angularVelocity = 0;
    this.leftThrust = 0;
    this.rightThrust = 0;
    this.bodyCollision = false;
    this.leftFootBottomCollision = false;
    this.leftFootSideCollision = false;
    this.rightFootBottomCollision = false;
    this.rightFootSideCollision = false;
    this.crashed = false;
    this.landed = false;
  }

  resetCollisions() {
    this.bodyCollision = false;
    this.leftFootBottomCollision = false;
    this.leftFootSideCollision = false;
    this.rightFootBottomCollision = false;
    this.rightFootSideCollision = false;
  }

  update(input) {
    this.updateFuel();
    this.updateThrust(input);
    this.updateRotation();
    this.updatePosition();
    this.updateCrashedAndLanded();
  }

  updateFuel() {
    this.fuel -= this.leftThrust + this.rightThrust;
  }

  updateThrust(input) {
    if (this.fuel > 0) {
      this.leftThrust = input.leftTrigger * this.triggerToThrust;
      this.rightThrust = input.rightTrigger * this.triggerToThrust;
    } else {
      this.leftThrust = 0;
      this.rightThrust = 0;
    }
  }

  updatePosition() {
    this.velocity.x +=
      (this.leftThrust / this.mass / 60) * Math.sin(this.rotation) +
      (this.rightThrust / this.mass / 60) * Math.sin(this.rotation);

    this.velocity.y +=
      -(this.leftThrust / this.mass / 60) * Math.cos(this.rotation) -
      (this.rightThrust / this.mass / 60) * Math.cos(this.rotation) +
      this.gravity / 60;

    if ((this.leftFootBottomCollision && this.rightFootBottomCollision) || this.bodyCollision) {
      if (this.velocity.y > 0) this.velocity.y = 0;
    }
    if (this.leftFootSideCollision && this.rightFootSideCollision) {
      if (this.velocity.x < 0) this.velocity.x = 0;
      if (this.velocity.x > 0) this.velocity.x = 0;
    }

    if ((this.leftFootBottomCollision || this.rightFootBottomCollision) && Math.abs(this.velocity.x) < this.friction) {
      this.velocity.x = 0;
    } else if (this.leftFootBottomCollision && this.rightFootBottomCollision && this.velocity.x > 0) {
      this.velocity.x -= this.friction;
    } else if (this.leftFootBottomCollision && this.rightFootBottomCollision && this.velocity.x < 0) {
      this.velocity.x += this.friction;
    }

    this.position.x += this.velocity.x;
    this.position.y += this.velocity.y;

    if (this.position.y >= 687) {
      this.position.y = 687;
      this.velocity.y = 0;
    } else if (this.position.y <= 33) {
      this.position.y = 33;
      this.velocity.y = 0;
    }
    if (this.position.x >= 1247) {
      this.position.x = 1247;
      this.velocity.x = 0;
    } else if (this.position.x <= 33) {
      this.position.x = 33;
      this.velocity.x = 0;
    }
  }

  updateRotation() {
    this.angularVelocity +=
      this.leftThrust / this.mass / 60 / (this.radius / 4) -
      this.rightThrust / this.mass / 60 / (this.radius / 4);

    if (this.leftFootBottomCollision && this.rightFootBottomCollision) {
      this.angularVelocity = 0;
    } else if (this.leftFootBottomCollision && this.velocity.y > 0) {
      if (this.angularVelocity < 0) this.angularVelocity = 0;
      else this.angularVelocity += (this.velocity.y * Math.cos(this.rotation)) / this.radius;
    } else if (this.rightFootBottomCollision && this.velocity.y > 0) {
      if (this.angularVelocity > 0) this.angularVelocity = 0;
      else this.angularVelocity -= (this.velocity.y * Math.cos(this.rotation)) / this.radius;
    }

    this.rotation += this.angularVelocity;
  }

  updateCrashedAndLanded() {
    if (this.bodyCollision) {
      this.crashed = true;
    } else if (
      (this.leftFootBottomCollision || this.rightFootBottomCollision) &&
      (Math.abs(this.velocity.x) > this.crashVelocity || Math.abs(this.velocity.y) > this.crashVelocity)
    ) {
      this.crashed = true;
    } else if (
      this.leftFootBottomCollision &&
      this.rightFootBottomCollision &&
      this.velocity.x === 0 &&
      this.velocity.y === 0
    ) {
      this.landed = true;
    }
  }

  calculateScore() {
    const wrapped = Math.abs(this.rotation) % (2 * Math.PI);
    const levelness =
      wrapped < Math.PI
        ? ((Math.PI - wrapped) * 5000) / Math.PI
        : ((wrapped - Math.PI) * 5000) / Math.PI;
    return Math.trunc(levelness + this.fuel / 1000);
  }
}
