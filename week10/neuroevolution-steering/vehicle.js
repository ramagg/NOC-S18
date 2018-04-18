// Daniel Shiffman
// Nature of Code: Intelligence and Learning
// https://github.com/shiffman/NOC-S17-2-Intelligence-Learning

// Evolutionary "Steering Behavior" Simulation

let eat_threshold = 8;
let sensor_angle;
let sensor_length = 100;

class Sensor {
  constructor(angle) {
    this.angle = angle;
    this.vals = [0, 0];
  }
}

// Create a new vehicle
class Vehicle {
  constructor(x, y, brain) {

    // All the physics stuff
    this.acceleration = createVector();
    this.velocity = p5.Vector.random2D();
    this.position = createVector(x, y);
    this.r = 3;
    this.maxforce = .1;
    this.maxspeed = 4;
    this.velocity.setMag(this.maxspeed);
    this.score = 0;

    this.sensors = [];
    let radius = sensor_length;
    sensor_angle = TWO_PI / 8;
    for (let i = 0; i < 2 * PI; i += sensor_angle) {
      this.sensors.push(new Sensor(i));
    }


    if (arguments[2] instanceof NeuralNetwork) {
      this.brain = brain.copy();
      this.brain.mutate(0.1);
    } else {
      //let inputs = this.sensors.length*2;
      let inputs = this.sensors.length + 6;
      this.brain = new NeuralNetwork(inputs, 16, 2);
    }

    // Health
    this.health = 1;
  }


  // Method to update location
  update() {
    // Update velocity
    this.velocity.add(this.acceleration);
    // Limit speed
    this.velocity.limit(this.maxspeed);
    this.position.add(this.velocity);
    // Reset acceleration to 0 each cycle
    this.acceleration.mult(0);

    // Slowly die unless you eat
    this.health -= 0.005;
    this.score += 1;
  }

  // Return true if health is less than zero
  dead() {
    return (this.health < 0 ||
      this.position.x > width + this.r ||
      this.position.x < -this.r ||
      this.position.y > height + this.r ||
      this.position.y < -this.r
    );
  }

  // Small chance of returning a new child vehicle
  birth(prob) {
    let r = random(1);
    if (r < prob) {
      // Same location, same DNA
      //return new Vehicle(this.position.x, this.position.y, this.brain);
      return new Vehicle(random(width), random(height), this.brain);
    }
  }

  // Check against array of food or poison
  // index = 0 for food, index = 1 for poison
  eat(list, index) {

    for (let j = 0; j < this.sensors.length; j++) {
      this.sensors[j].vals[index] = sensor_length;
    }

    for (let i = 0; i < list.length; i++) {
      let otherPosition = list[i];
      let dist = p5.Vector.dist(this.position, otherPosition);
      if (dist > sensor_length) continue;
      let angle = p5.Vector.sub(otherPosition, this.position).heading();
      for (let j = 0; j < this.sensors.length; j++) {
        let lower = this.sensors[j].angle - sensor_angle / 2;
        let higher = this.sensors[j].angle + sensor_angle / 2;
        // console.log(lower, angle, higher);
        if (
          (angle > lower && angle < higher) ||
          (angle > lower + TWO_PI && angle < higher + TWO_PI) ||
          (angle > lower - TWO_PI && angle < higher - TWO_PI)
        ) {
          this.sensors[j].vals[0] = min(this.sensors[j].vals[0], dist);
        }
        // let a = this.position;
        // let b = p5.Vector.add(a, this.sensors[j].pos);
        // let c = list[i];
        // let r = eat_threshold;
        // let intersection = intersecting(a, b, c, r);
        // if (intersection) {
        //   this.sensors[j].vals[index] += map(p5.Vector.dist(a, c) - r, 0, sensor_length, 1, 0);
        // }
      }
    }

    //let a = this.sensors.map(s => s.vals[0]);
    //console.log(a);


    let inputs = [];
    inputs[0] = constrain(map(this.position.x, 50, 0, 0, 1), 0, 1);
    inputs[1] = constrain(map(this.position.y, 50, 0, 0, 1), 0, 1);
    inputs[2] = constrain(map(this.position.x, width - 50, width, 0, 1), 0, 1);
    inputs[3] = constrain(map(this.position.y, height - 50, height, 0, 1), 0, 1);
    inputs[4] = this.velocity.x / this.maxspeed;
    inputs[5] = this.velocity.y / this.maxspeed;


    //let i = 0;
    for (let j = 0; j < this.sensors.length; j++) {
      inputs[j + 6] = map(this.sensors[j].vals[0], 0, sensor_length, 1, 0);
      //i++;
      //inputs[i+1] = this.sensors[j].vals[1];
      //i += 2;
    }
    let outputs = this.brain.predict(inputs);
    let desired = createVector(2 * outputs[0] - 1, 2 * outputs[1] - 1);
    //console.log(nf(desired.x, 1, 2), nf(desired.y, 1, 2));
    //this.velocity = desired.copy();
    // //force.limit(this.maxforce);
    desired.mult(this.maxspeed);
    let steer = p5.Vector.sub(desired, this.velocity);
    steer.limit(this.maxforce);
    // steer.limit(this.maxforce);
    //console.log(force.x, force.y, force.mag());
    this.applyForce(steer);

    // Look at everything
    for (let i = list.length - 1; i >= 0; i--) {
      // Calculate distance
      let d = p5.Vector.dist(list[i], this.position);
      // If we're withing 5 pixels, eat it!
      if (d < eat_threshold) {
        list.splice(i, 1);
        // Add or subtract from health based on kind of food
        this.health += nutrition[index];
        // this.score++;
      }
    }
  }

  // Add force to acceleration
  applyForce(force) {
    this.acceleration.add(force);
  }


  display() {

    // Color based on health
    let green = color(0, 255, 0);
    let red = color(255, 0, 0);
    let col = lerpColor(red, green, this.health)

    // Draw a triangle rotated in the direction of velocity
    let theta = this.velocity.heading() + PI / 2;
    push();
    translate(this.position.x, this.position.y);

    // Extra info
    if (debug.checked()) {
      for (let i = 0; i < this.sensors.length; i++) {
        // if (this.sensors[i].vals[1] == 1) {
        //   stroke(255, 0, 0);
        // } else if (this.sensors[i].vals[0] == 1) {
        //   stroke(0, 255, 0);
        // } else {
        //   stroke(255, 100);
        // }
        let val = this.sensors[i].vals[0];
        if (val > 0) {
          stroke(0, 255, 0, map(this.sensors[i].vals[0], 0, sensor_length, 255, 0));
          let angle = this.sensors[i].angle;
          line(0, 0, cos(angle) * sensor_length, sin(angle) * sensor_length);
        }
      }
    }
    rotate(theta);

    // Draw the vehicle itself
    fill(col);
    stroke(col);
    beginShape();
    vertex(0, -this.r * 2);
    vertex(-this.r, this.r * 2);
    vertex(this.r, this.r * 2);
    endShape(CLOSE);
    pop();
  }

  highlight() {
    fill(255, 0, 255, 100);
    stroke(255);
    ellipse(this.position.x, this.position.y, 32, 32);
  }

  wrap() {
    if (this.position.x < -this.r) this.position.x = width + this.r;
    if (this.position.y < -this.r) this.position.y = height + this.r;
    if (this.position.x > width + this.r) this.position.x = -this.r;
    if (this.position.y > height + this.r) this.position.y = -this.r;
  }


  // A force to keep it on screen
  boundaries() {
    let d = 0;
    let desired = null;
    if (this.position.x < d) {
      desired = createVector(this.maxspeed, this.velocity.y);
    } else if (this.position.x > width - d) {
      desired = createVector(-this.maxspeed, this.velocity.y);
    }

    if (this.position.y < d) {
      desired = createVector(this.velocity.x, this.maxspeed);
    } else if (this.position.y > height - d) {
      desired = createVector(this.velocity.x, -this.maxspeed);
    }
    //console.log(desired);

    if (desired !== null) {
      desired.setMag(this.maxspeed);
      let steer = p5.Vector.sub(desired, this.velocity);
      steer.limit(this.maxforce);
      this.applyForce(steer);
    }
  }
}