// Daniel Shiffman
// http://codingtra.in
// http://patreon.com/codingtrain
// Code for: https://youtu.be/urR596FsU68

// module aliases
const Engine = Matter.Engine;
// Render = Matter.Render,
const World = Matter.World;
const Bodies = Matter.Bodies;

let engine;
let world;
let boxes = [];

let ground;

function setup() {
  createCanvas(400, 400);
  engine = Engine.create();
  world = engine.world;
  //Engine.run(engine);
  let options = {
    isStatic: true
  }
  ground = Bodies.rectangle(200, height, width, 100, options);

  World.add(world, ground);
}

// function keyPressed() {
//   if (key == ' ') {
//   }
// }

function mousePressed() {
  boxes.push(new Box(mouseX, mouseY, random(10, 40), random(10, 40)));
}

function draw() {
  background(51);
  Engine.update(engine);
  for (let i = 0; i < boxes.length; i++) {
    boxes[i].show();
  }
  noStroke(255);
  fill(170);
  rectMode(CENTER);
  rect(ground.position.x, ground.position.y, width, 100);

}