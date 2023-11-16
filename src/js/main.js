import * as THREE from 'three';
import CameraController from './CameraController.js';
import FrameBufferObject from './FrameBufferObject.js';
import Background from './Background.js';
import Skull from './Skull.js';
import Bird from './Bird.js';
import Flock from './Flock.js';
import Particles from './Particles.js';


// Set up the scene, camera, and renderer
const scene = new THREE.Scene();

// Orthographic for surrealness 
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2 / 220, // Left
  window.innerWidth / 2 / 220,  // Right
  window.innerHeight / 2 / 220, // Top
  window.innerHeight / -2 / 220, // Bottom
  1, 1000 // Near and Far
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// how many birds to add to the scene
var numberofbirds = 40;

// frame buffer object handles post render effects, for the water
const fbo = new FrameBufferObject(renderer, window.innerWidth, window.innerHeight);

// Add a directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
directionalLight.position.set(-1, 5, 3); // Position the light
directionalLight.name = 'mainDirectionalLight';
scene.add(directionalLight);

// Set global ambient light color
const ambientLight = new THREE.AmbientLight(0x404040);
scene.add(ambientLight);

// Set up subtle colored fog
const fogColor = new THREE.Color(0xffef00); // Adjust the fog color
const near = 0.1;
const far = 200;
scene.fog = new THREE.Fog(fogColor, near, far);


// allows the user to slightly change the camera location using the mouse
const cameraController = new CameraController();
const skull = new Skull();
skull.loadSkull(scene, fbo);

// add a background
let background = new Background();
scene.add(background.getBackgroundMesh());



let particles = new Particles();
scene.add(particles);


// we put the birds in the tree. and they like to stay there if undisturbed.
var treeposition1 = new THREE.Vector3(-1.3, .6, -.7);
var treeposition2 = new THREE.Vector3(.5, .9, 1.4);

// flocking birds in the trees 
let birds = [];
let flocks = [];
let flockscale = 300;

for (var i = 0; i < numberofbirds; i++) {
  var flock = flocks[i] = new Flock();
  var bird = birds[i] = new Bird();
  scene.add(bird);

  // put the bird in a random tree
  var targetpos = i % 2 == 0 ? treeposition2 : treeposition1;

  // we use some magic numbers to put a 3d cursor on the skull
  flock.position.set(
    targetpos.x * flockscale + Math.random() * 60 - 30,
    targetpos.y * flockscale + Math.random() * 60 - 30,
    targetpos.z * flockscale + Math.random() * 60 - 30);
}

// mouse move logic to disturb the birds. Handled seperatly from the camera controll
var castedmousepos = new THREE.Vector3();
var mousevector = new THREE.Vector3();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

function onDocumentMouseMove(event) {
  // Calculate normalized device coordinates
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  // Update the picking ray with the camera and mouse position
  raycaster.setFromCamera(mouse, camera);

  // Calculate the intersection point with the plane
  var distance = 19;
  raycaster.ray.at(distance, castedmousepos);
  mousevector.set(castedmousepos.x * flockscale, castedmousepos.y * flockscale, castedmousepos.z * flockscale);

  for (var i = 0, il = flocks.length; i < il; i++) {
    var disturbed = flocks[i].repulse(mousevector);
    var disturbed = flocks[i].repulse(mousevector);
    if (disturbed) {
      birds[i].disturb(mousevector);
    }
  }
}
// mouse movements to disturb the birds
document.addEventListener("mousemove", onDocumentMouseMove, false);
document.addEventListener('touchstart', onDocumentMouseMove, false);


// Function to handle window resize
function onWindowResize() {
  camera.left = window.innerWidth / -2 / 220;
  camera.right = window.innerWidth / 2 / 220;
  camera.top = window.innerHeight / 2 / 220;
  camera.bottom = window.innerHeight / -2 / 220;
  camera.updateProjectionMatrix();

  renderer.setSize( window.innerWidth, window.innerHeight );
}

// Add an event listener for window resize
window.addEventListener('resize', onWindowResize);


let prevTime = performance.now();
const treeposition1real = treeposition1.clone().multiplyScalar(flockscale);
const treeposition2real = treeposition2.clone().multiplyScalar(flockscale);
const animateCamera = () => {

  const time = performance.now();
  const deltaTime = time - prevTime;

  const extendedpoint = cameraController.CaluclateCameraVector(deltaTime);
  camera.position.set(extendedpoint.x, extendedpoint.y, extendedpoint.z);
  camera.lookAt(0, 0, 0);

  skull.requestAnimationFrameTick(deltaTime);
  renderer.render(scene, camera);

  // create a basic movement based on the mouse position
  background.updateMouseCursor({ x: cameraController.getCursorDelta().x * 20000, y: cameraController.getCursorDelta().y * 20000});
  background.requestAnimationFrameTick();
  requestAnimationFrame(animateCamera);

  // update the frame buffer (used for water effects)
  fbo.update(scene, camera);

//  animateWaterParticles();

  // create bird logic 
  for (var i = 0, il = birds.length; i < il; i++) {
    flock = flocks[i];
    var bird = birds[i];
    flock.setResting(!bird.isDisturbed() && bird.restingInTree());
    flock.run(flocks);

    bird.updateColor();
    bird.faceFlyingDirection(flock, flockscale);
    bird.updateWing(time / 1000);

    // attract to two trees
    flocks[i].attract(treeposition1real);
    flocks[i].attract(treeposition2real);
    flocks[i].repulse_skull(new THREE.Vector3(0, .4, 0));

    // there is a bit of a bug here - if a bird flys through a tree it can 'land' in the air
    if (!bird.isDisturbed()) {
      bird.checkrest(treeposition1);
      bird.checkrest(treeposition2);
    }
    bird.tick(deltaTime / 1000);
  }
  prevTime = time;
  particles.animateWaterParticles();
};

animateCamera();


// Create an animation function
const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

animate();
