import * as THREE from 'three';

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x050510, 0.015);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 2.5, 6);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
document.body.appendChild(renderer.domElement);

let isTouching = false;
let targetX = 0;
let targetY = 0;
const maxHorizontal = 4.5;
const maxVertical = 3.0;

function updateShipTarget(e) {
  const normX = (e.clientX / window.innerWidth) * 2 - 1;
  const normY = -(e.clientY / window.innerHeight) * 2 + 1;
  targetX = normX * maxHorizontal;
  targetY = normY * maxVertical;
}

window.addEventListener('pointerdown', (e) => {
  isTouching = true;
  updateShipTarget(e);
});
window.addEventListener('pointermove', (e) => {
  if (isTouching) updateShipTarget(e);
});
window.addEventListener('pointerup', () => { isTouching = false; });
window.addEventListener('pointercancel', () => { isTouching = false; });

// Audio setup using Web Audio API
const audioContext = new (window.AudioContext || window.webkitAudioContext)();
const sounds = {
  thrust: null,
  score: null,
  crash: null,
};

function createSound(type) {
  const oscillator = audioContext.createOscillator();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(440, audioContext.currentTime);
  oscillator.connect(audioContext.destination);
  oscillator.start();
  oscillator.stop(audioContext.currentTime + 0.1);
}

function playSound(action) {
  switch(action) {
    case 'thrust':
      createSound('sine'); // Thrust sound
      break;
    case 'score':
      createSound('square'); // Score sound
      break;
    case 'crash':
      createSound('triangle'); // Crash sound
      break;
  }
}

function gameOver() {
  alert('Game Over!');
  playSound('crash');
}

function restartGame() {
  // Restart game logic here
  playSound('score');
}

// Game loop
function animate() {
  requestAnimationFrame(animate);
  // Game updating logic
  ship.position.x += (targetX - ship.position.x) * 0.12;
  ship.position.y += (targetY - ship.position.y) * 0.12;
  ship.rotation.z = -(targetX - ship.position.x) * 0.35;
  ship.rotation.x = (targetY - ship.position.y) * 0.25;
  renderer.render(scene, camera);
}

animate();

// Capture keyboard inputs for game actions
window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'w') {
    playSound('thrust'); // Thrust sound on move
  }
});
