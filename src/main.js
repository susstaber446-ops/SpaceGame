import * as THREE from 'three';

// ─── AUDIO SYNTHESIZER (WEB AUDIO API - ZERO ASSETS) ─────────────────────────
class SoundFX {
  constructor() {
    this.ctx = null;
    this.engineOsc = null;
    this.engineGain = null;
    this.isMuted = false;
  }

  init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    this.startEngineHum();
  }

  startEngineHum() {
    if (!this.ctx) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      const filter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.setValueAtTime(65, this.ctx.currentTime);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(220, this.ctx.currentTime);

      this.engineGain.gain.setValueAtTime(0.06, this.ctx.currentTime);

      this.engineOsc.connect(filter);
      filter.connect(this.engineGain);
      this.engineGain.connect(this.ctx.destination);

      this.engineOsc.start();
    } catch (e) {
      // Audio autoplay policy fallback
    }
  }

  setEngineSpeed(factor) {
    if (!this.ctx || !this.engineOsc) return;
    const baseFreq = 65 + factor * 70;
    this.engineOsc.frequency.setTargetAtTime(baseFreq, this.ctx.currentTime, 0.1);
  }

  playRingChime() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const notes = [659.25, 880.00, 1318.51]; // E5, A5, E6
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.05);

      gain.gain.setValueAtTime(0.18, now + idx * 0.05);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.05 + 0.35);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now + idx * 0.05);
      osc.stop(now + idx * 0.05 + 0.36);
    });
  }

  playAsteroidHit() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    // Sub-bass punch
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(30, now + 0.3);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.3);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.31);

    // Noise crackle
    const bufferSize = this.ctx.sampleRate * 0.25;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }

    const whiteNoise = this.ctx.createBufferSource();
    whiteNoise.buffer = noiseBuffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'bandpass';
    noiseFilter.frequency.setValueAtTime(1200, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.01, now + 0.25);

    whiteNoise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    whiteNoise.start(now);
  }

  playBoostWhoosh() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(200, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.4);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.45);

    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.46);
  }

  playGameOver() {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    [220, 196, 164, 130].forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + idx * 0.12);

      gain.gain.setValueAtTime(0.2, now + idx * 0.12);
      gain.gain.exponentialRampToValueAtTime(0.01, now + idx * 0.12 + 0.5);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + idx * 0.12);
      osc.stop(now + idx * 0.12 + 0.51);
    });
  }
}

const sfx = new SoundFX();

// ─── THREE.JS SCENE INITIALIZATION ───────────────────────────────────────────
const container = document.getElementById('game-container');
const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x05001a, 0.0035);

const camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1200);
camera.position.set(0, 3.2, 8.5);

const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
container.appendChild(renderer.domElement);

// Lighting
const ambientLight = new THREE.AmbientLight(0x4466aa, 1.2);
scene.add(ambientLight);

const sunLight = new THREE.DirectionalLight(0xffffff, 2.0);
sunLight.position.set(15, 30, 20);
scene.add(sunLight);

// ─── STARFIELD (WARP STARS) ──────────────────────────────────────────────────
const STAR_COUNT = 3500;
const starGeo = new THREE.BufferGeometry();
const starPositions = new Float32Array(STAR_COUNT * 3);
const starColors = new Float32Array(STAR_COUNT * 3);

for (let i = 0; i < STAR_COUNT; i++) {
  starPositions[i * 3] = (Math.random() - 0.5) * 220;
  starPositions[i * 3 + 1] = (Math.random() - 0.5) * 160;
  starPositions[i * 3 + 2] = -Math.random() * 900;

  // Varied celestial colors: cyan, violet, golden, white
  const p = Math.random();
  if (p < 0.4) {
    starColors[i * 3] = 0.0; starColors[i * 3 + 1] = 0.94; starColors[i * 3 + 2] = 1.0; // Cyan
  } else if (p < 0.7) {
    starColors[i * 3] = 0.8; starColors[i * 3 + 1] = 0.2; starColors[i * 3 + 2] = 1.0; // Violet
  } else if (p < 0.85) {
    starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 0.85; starColors[i * 3 + 2] = 0.4; // Gold
  } else {
    starColors[i * 3] = 1.0; starColors[i * 3 + 1] = 1.0; starColors[i * 3 + 2] = 1.0; // White
  }
}

starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

const starMat = new THREE.PointsMaterial({
  size: 1.6,
  vertexColors: true,
  transparent: true,
  opacity: 0.9,
  sizeAttenuation: true,
});
const starField = new THREE.Points(starGeo, starMat);
scene.add(starField);

// ─── SLEEK CYBERPUNK STARFIGHTER MODEL ───────────────────────────────────────
function createInterceptorShip() {
  const shipGroup = new THREE.Group();

  // Materials
  const hullMat = new THREE.MeshStandardMaterial({
    color: 0x141a29,
    roughness: 0.25,
    metalness: 0.85,
  });

  const trimMat = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    emissive: 0x00f0ff,
    emissiveIntensity: 2.5,
  });

  const canopyMat = new THREE.MeshStandardMaterial({
    color: 0x00ffff,
    roughness: 0.1,
    metalness: 0.9,
    emissive: 0x0077aa,
    emissiveIntensity: 0.8,
  });

  const engineMat = new THREE.MeshBasicMaterial({
    color: 0x00ffff,
  });

  // 1. Central Fuselage Body
  const bodyGeo = new THREE.ConeGeometry(0.9, 4.2, 5);
  bodyGeo.rotateX(Math.PI / 2);
  const body = new THREE.Mesh(bodyGeo, hullMat);
  body.scale.set(1.1, 0.45, 1.0);
  shipGroup.add(body);

  // 2. Cockpit Canopy
  const canopyGeo = new THREE.ConeGeometry(0.42, 2.2, 4);
  canopyGeo.rotateX(Math.PI / 2);
  const canopy = new THREE.Mesh(canopyGeo, canopyMat);
  canopy.position.set(0, 0.28, 0.2);
  canopy.scale.set(0.9, 0.35, 0.9);
  shipGroup.add(canopy);

  // 3. Main Swept Delta Wings
  const wingShape = new THREE.Shape();
  wingShape.moveTo(0, 0);
  wingShape.lineTo(3.2, -1.8);
  wingShape.lineTo(3.0, -2.6);
  wingShape.lineTo(0, -1.6);
  wingShape.closePath();

  const extrudeSettings = { depth: 0.08, bevelEnabled: true, bevelThickness: 0.03, bevelSize: 0.03 };
  const leftWingGeo = new THREE.ExtrudeGeometry(wingShape, extrudeSettings);
  leftWingGeo.rotateX(Math.PI / 2);
  const leftWing = new THREE.Mesh(leftWingGeo, hullMat);
  leftWing.position.set(0.3, 0.0, 0.2);
  shipGroup.add(leftWing);

  const rightWingGeo = leftWingGeo.clone();
  rightWingGeo.scale(-1, 1, 1);
  const rightWing = new THREE.Mesh(rightWingGeo, hullMat);
  rightWing.position.set(-0.3, 0.0, 0.2);
  shipGroup.add(rightWing);

  // 4. Glowing Neon Wingtip Trails
  const wingtipGeo = new THREE.BoxGeometry(0.12, 0.15, 1.2);
  const leftTip = new THREE.Mesh(wingtipGeo, trimMat);
  leftTip.position.set(3.1, 0.05, -1.0);
  shipGroup.add(leftTip);

  const rightTip = new THREE.Mesh(wingtipGeo, trimMat);
  rightTip.position.set(-3.1, 0.05, -1.0);
  shipGroup.add(rightTip);

  // 5. Vertical Wingtip Stabilizers
  const finGeo = new THREE.BoxGeometry(0.08, 0.7, 0.8);
  const leftFin = new THREE.Mesh(finGeo, hullMat);
  leftFin.position.set(3.1, 0.35, -1.0);
  leftFin.rotation.z = -0.2;
  shipGroup.add(leftFin);

  const rightFin = new THREE.Mesh(finGeo, hullMat);
  rightFin.position.set(-3.1, 0.35, -1.0);
  rightFin.rotation.z = 0.2;
  shipGroup.add(rightFin);

  // 6. Dual Ion Thrusters
  const thrusterGeo = new THREE.CylinderGeometry(0.24, 0.3, 0.9, 12);
  thrusterGeo.rotateX(Math.PI / 2);

  const leftThruster = new THREE.Mesh(thrusterGeo, hullMat);
  leftThruster.position.set(0.48, 0.0, -1.9);
  shipGroup.add(leftThruster);

  const rightThruster = new THREE.Mesh(thrusterGeo, hullMat);
  rightThruster.position.set(-0.48, 0.0, -1.9);
  shipGroup.add(rightThruster);

  // 7. Glowing Plasma Discs
  const plasmaGeo = new THREE.CircleGeometry(0.22, 12);
  const leftPlasma = new THREE.Mesh(plasmaGeo, engineMat);
  leftPlasma.position.set(0.48, 0.0, -2.36);
  shipGroup.add(leftPlasma);

  const rightPlasma = new THREE.Mesh(plasmaGeo, engineMat);
  rightPlasma.position.set(-0.48, 0.0, -2.36);
  shipGroup.add(rightPlasma);

  // Thruster Light
  const thrusterLight = new THREE.PointLight(0x00f0ff, 4.0, 15);
  thrusterLight.position.set(0, 0, -2.8);
  shipGroup.add(thrusterLight);

  return { group: shipGroup, thrusterLight, leftPlasma, rightPlasma };
}

const shipObj = createInterceptorShip();
const ship = shipObj.group;
scene.add(ship);

// ─── PROCEDURAL NEON RINGS & ASTEROIDS POOL ─────────────────────────────────
const RINGS_COUNT = 8;
const ASTEROIDS_COUNT = 15;
const CORRIDOR_RADIUS_X = 14;
const CORRIDOR_RADIUS_Y = 8;
const SPAWN_DISTANCE = -750;

const rings = [];
const ringGeo = new THREE.TorusGeometry(3.2, 0.28, 16, 36);
const ringMatCyan = new THREE.MeshStandardMaterial({
  color: 0x00f0ff,
  emissive: 0x00f0ff,
  emissiveIntensity: 3.0,
  roughness: 0.2,
});
const ringMatMagenta = new THREE.MeshStandardMaterial({
  color: 0xff00d4,
  emissive: 0xff00d4,
  emissiveIntensity: 3.0,
  roughness: 0.2,
});

for (let i = 0; i < RINGS_COUNT; i++) {
  const isCyan = i % 2 === 0;
  const mesh = new THREE.Mesh(ringGeo, isCyan ? ringMatCyan : ringMatMagenta);
  mesh.position.set(
    (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 1.5,
    (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 1.5,
    -100 - i * 90
  );
  mesh.userData = {
    collected: false,
    rotSpeed: (Math.random() * 0.04 + 0.02) * (Math.random() < 0.5 ? 1 : -1),
    colorType: isCyan ? 'cyan' : 'magenta',
  };
  scene.add(mesh);
  rings.push(mesh);
}

// Asteroids
const asteroids = [];
const asteroidMat = new THREE.MeshStandardMaterial({
  color: 0x3a4254,
  roughness: 0.85,
  metalness: 0.2,
});

for (let i = 0; i < ASTEROIDS_COUNT; i++) {
  const size = Math.random() * 1.2 + 1.2;
  const geo = new THREE.DodecahedronGeometry(size, 1);

  // Perturb vertices for bumpy asteroid shape
  const pos = geo.attributes.position;
  for (let j = 0; j < pos.count; j++) {
    const vx = pos.getX(j);
    const vy = pos.getY(j);
    const vz = pos.getZ(j);
    const factor = 1.0 + (Math.random() - 0.5) * 0.35;
    pos.setXYZ(j, vx * factor, vy * factor, vz * factor);
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, asteroidMat);
  mesh.position.set(
    (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 2,
    (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 2,
    -80 - i * 55
  );
  mesh.userData = {
    rotSpeedX: (Math.random() - 0.5) * 0.04,
    rotSpeedY: (Math.random() - 0.5) * 0.04,
    rotSpeedZ: (Math.random() - 0.5) * 0.04,
    radius: size * 1.1,
    hit: false,
  };
  scene.add(mesh);
  asteroids.push(mesh);
}

// ─── GAME STATE & VARIABLES ──────────────────────────────────────────────────
let gameState = 'START'; // START, PLAYING, PAUSED, GAMEOVER
let score = 0;
let ringsCollected = 0;
let distanceTraveled = 0;
let shield = 100;
let baseSpeed = 120;
let currentSpeed = baseSpeed;
let isBoosting = false;
let boostEnergy = 100;
let highScore = parseInt(localStorage.getItem('hyperdrive_best') || '0', 10);

// Camera shake
let cameraShake = 0;

// Ship controls & physics
let targetShipX = 0;
let targetShipY = 0;
const SHIP_MAX_X = 13.0;
const SHIP_MAX_Y = 7.5;
let isPointerDown = false;
let pointerStartX = 0;
let pointerStartY = 0;
let shipStartX = 0;
let shipStartY = 0;

// Keyboard state
const keys = {};

// ─── DOM ELEMENTS ────────────────────────────────────────────────────────────
const hud = document.getElementById('hud');
const scoreDisplay = document.getElementById('score-display');
const speedDisplay = document.getElementById('speed-display');
const distDisplay = document.getElementById('dist-display');
const shieldFill = document.getElementById('shield-fill');
const shieldText = document.getElementById('shield-text');
const comboBadge = document.getElementById('combo-badge');
const screenFlash = document.getElementById('screen-flash');
const boostRingFill = document.getElementById('boost-ring-fill');
const btnBoost = document.getElementById('btn-boost');
const btnPause = document.getElementById('btn-pause');
const touchReticle = document.getElementById('touch-reticle');

const screenStart = document.getElementById('screen-start');
const screenGameOver = document.getElementById('screen-gameover');
const screenPause = document.getElementById('screen-pause');
const btnStart = document.getElementById('btn-start');
const btnRestart = document.getElementById('btn-restart');
const btnResume = document.getElementById('btn-resume');
const startHighScore = document.getElementById('start-high-score');

const goScore = document.getElementById('go-score');
const goRings = document.getElementById('go-rings');
const goDistance = document.getElementById('go-distance');
const goBest = document.getElementById('go-best');

startHighScore.textContent = `CAREER BEST: ${highScore}`;

// ─── EVENT HANDLERS ──────────────────────────────────────────────────────────
btnStart.addEventListener('click', startGame);
btnRestart.addEventListener('click', restartGame);
btnResume.addEventListener('click', togglePause);
btnPause.addEventListener('click', togglePause);

function startGame() {
  sfx.init();
  screenStart.classList.add('hidden');
  hud.classList.remove('hidden');
  resetGameVars();
  gameState = 'PLAYING';
}

function restartGame() {
  sfx.init();
  screenGameOver.classList.add('hidden');
  hud.classList.remove('hidden');
  resetGameVars();
  gameState = 'PLAYING';
}

function togglePause() {
  if (gameState === 'PLAYING') {
    gameState = 'PAUSED';
    screenPause.classList.remove('hidden');
  } else if (gameState === 'PAUSED') {
    gameState = 'PLAYING';
    screenPause.classList.add('hidden');
  }
}

function resetGameVars() {
  score = 0;
  ringsCollected = 0;
  distanceTraveled = 0;
  shield = 100;
  boostEnergy = 100;
  targetShipX = 0;
  targetShipY = 0;
  ship.position.set(0, 0, 0);
  ship.rotation.set(0, 0, 0);

  updateShieldUI();
  updateScoreUI();

  // Reset obstacles positions
  rings.forEach((r, idx) => {
    r.position.set(
      (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 1.5,
      (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 1.5,
      -100 - idx * 90
    );
    r.scale.set(1, 1, 1);
    r.userData.collected = false;
  });

  asteroids.forEach((a, idx) => {
    a.position.set(
      (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 2,
      (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 2,
      -80 - idx * 55
    );
    a.userData.hit = false;
  });
}

// Touch & Pointer Steering
window.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) return;
  if (gameState !== 'PLAYING') return;

  isPointerDown = true;
  pointerStartX = e.clientX;
  pointerStartY = e.clientY;
  shipStartX = targetShipX;
  shipStartY = targetShipY;

  touchReticle.style.left = `${e.clientX}px`;
  touchReticle.style.top = `${e.clientY}px`;
  touchReticle.classList.remove('hidden');
});

window.addEventListener('pointermove', (e) => {
  if (!isPointerDown || gameState !== 'PLAYING') return;

  const dx = (e.clientX - pointerStartX) / window.innerWidth;
  const dy = (e.clientY - pointerStartY) / window.innerHeight;

  targetShipX = Math.max(-SHIP_MAX_X, Math.min(SHIP_MAX_X, shipStartX + dx * 28.0));
  targetShipY = Math.max(-SHIP_MAX_Y, Math.min(SHIP_MAX_Y, shipStartY - dy * 18.0));

  touchReticle.style.left = `${e.clientX}px`;
  touchReticle.style.top = `${e.clientY}px`;
});

window.addEventListener('pointerup', () => {
  isPointerDown = false;
  touchReticle.classList.add('hidden');
});
window.addEventListener('pointercancel', () => {
  isPointerDown = false;
  touchReticle.classList.add('hidden');
});

// Boost Button Touch Handlers
function startBoost() {
  if (boostEnergy > 20 && !isBoosting) {
    isBoosting = true;
    sfx.playBoostWhoosh();
    btnBoost.classList.add('active');
    comboBadge.classList.remove('hidden');
  }
}

function stopBoost() {
  isBoosting = false;
  btnBoost.classList.remove('active');
  comboBadge.classList.add('hidden');
}

btnBoost.addEventListener('pointerdown', (e) => {
  e.stopPropagation();
  startBoost();
});
window.addEventListener('pointerup', stopBoost);

// Keyboard controls
window.addEventListener('keydown', (e) => {
  keys[e.key.toLowerCase()] = true;
  if (e.code === 'Space') startBoost();
  if (e.key === 'p' || e.key === 'Escape') togglePause();
});
window.addEventListener('keyup', (e) => {
  keys[e.key.toLowerCase()] = false;
  if (e.code === 'Space') stopBoost();
});

// Window resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// ─── UI UPDATE HELPERS ───────────────────────────────────────────────────────
function updateShieldUI() {
  shieldFill.style.width = `${Math.max(0, shield)}%`;
  shieldText.textContent = `${Math.max(0, Math.round(shield))}%`;

  if (shield <= 25) {
    shieldFill.classList.add('danger');
  } else {
    shieldFill.classList.remove('danger');
  }
}

function updateScoreUI() {
  scoreDisplay.textContent = String(Math.floor(score)).padStart(5, '0');
  speedDisplay.innerHTML = `${Math.round(currentSpeed)} <span class="unit">KM/S</span>`;
  distDisplay.textContent = `DIST: ${(distanceTraveled / 1000).toFixed(1)} KM`;
}

function triggerFlash(type) {
  screenFlash.className = `screen-flash ${type}`;
  setTimeout(() => {
    screenFlash.className = 'screen-flash';
  }, 160);
}

// ─── MAIN GAME LOOP ──────────────────────────────────────────────────────────
let lastTime = performance.now();

function animate(now) {
  requestAnimationFrame(animate);

  const delta = Math.min((now - lastTime) / 1000, 0.1);
  lastTime = now;

  if (gameState !== 'PLAYING') {
    renderer.render(scene, camera);
    return;
  }

  // 1. Handle Boost & Energy
  if (isBoosting) {
    boostEnergy -= delta * 35;
    if (boostEnergy <= 0) {
      boostEnergy = 0;
      stopBoost();
    }
  } else {
    boostEnergy = Math.min(100, boostEnergy + delta * 15);
  }

  const ringDash = (1 - boostEnergy / 100) * 276.46;
  boostRingFill.style.strokeDashoffset = ringDash;

  // Speed calculation
  const targetSpeed = isBoosting ? 240 : baseSpeed + Math.min(60, distanceTraveled / 50);
  currentSpeed += (targetSpeed - currentSpeed) * 0.1;
  sfx.setEngineSpeed((currentSpeed - baseSpeed) / 120);

  // Distance & Score progression
  const speedUnit = currentSpeed * delta * 2.5;
  distanceTraveled += currentSpeed * delta;
  score += delta * (isBoosting ? 30 : 15);
  updateScoreUI();

  // 2. Keyboard Input processing
  if (keys['arrowleft'] || keys['a']) targetShipX -= delta * 24.0;
  if (keys['arrowright'] || keys['d']) targetShipX += delta * 24.0;
  if (keys['arrowup'] || keys['w']) targetShipY += delta * 18.0;
  if (keys['arrowdown'] || keys['s']) targetShipY -= delta * 18.0;

  targetShipX = Math.max(-SHIP_MAX_X, Math.min(SHIP_MAX_X, targetShipX));
  targetShipY = Math.max(-SHIP_MAX_Y, Math.min(SHIP_MAX_Y, targetShipY));

  // 3. Smooth Ship Movement & Realistic Banking
  ship.position.x += (targetShipX - ship.position.x) * 0.14;
  ship.position.y += (targetShipY - ship.position.y) * 0.14;

  const rollTarget = -(targetShipX - ship.position.x) * 0.20;
  const pitchTarget = (targetShipY - ship.position.y) * 0.15;
  ship.rotation.z += (rollTarget - ship.rotation.z) * 0.18;
  ship.rotation.x += (pitchTarget - ship.rotation.x) * 0.18;

  // Thruster pulse effect
  const pulse = Math.sin(now * 0.02) * 0.2 + 1.0;
  shipObj.thrusterLight.intensity = (isBoosting ? 8.0 : 3.5) * pulse;
  shipObj.leftPlasma.scale.set(pulse, pulse, 1);
  shipObj.rightPlasma.scale.set(pulse, pulse, 1);

  // 4. Update Warp Starfield
  const starPosArr = starGeo.attributes.position.array;
  for (let i = 0; i < STAR_COUNT; i++) {
    starPosArr[i * 3 + 2] += speedUnit * 2.2;
    if (starPosArr[i * 3 + 2] > 20) {
      starPosArr[i * 3 + 2] = -900;
      starPosArr[i * 3] = (Math.random() - 0.5) * 220;
      starPosArr[i * 3 + 1] = (Math.random() - 0.5) * 160;
    }
  }
  starGeo.attributes.position.needsUpdate = true;

  // 5. Update Neon Rings
  rings.forEach((ring) => {
    ring.position.z += speedUnit;
    ring.rotation.z += ring.userData.rotSpeed;

    // Check collision when ring is close to ship plane (z ≈ 0)
    if (!ring.userData.collected && Math.abs(ring.position.z - ship.position.z) < 2.5) {
      const dx = ring.position.x - ship.position.x;
      const dy = ring.position.y - ship.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 3.2) {
        // RING COLLECTED!
        ring.userData.collected = true;
        score += isBoosting ? 200 : 100;
        ringsCollected++;
        shield = Math.min(100, shield + 12);
        updateShieldUI();
        sfx.playRingChime();
        triggerFlash('pickup');

        // Ring pop animation
        ring.scale.set(2.4, 2.4, 2.4);
      }
    }

    // Recycle ring behind camera
    if (ring.position.z > 25) {
      ring.position.z = SPAWN_DISTANCE - Math.random() * 80;
      ring.position.x = (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 1.5;
      ring.position.y = (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 1.5;
      ring.scale.set(1, 1, 1);
      ring.userData.collected = false;
    }
  });

  // 6. Update Asteroids
  asteroids.forEach((asteroid) => {
    asteroid.position.z += speedUnit;
    asteroid.rotation.x += asteroid.userData.rotSpeedX;
    asteroid.rotation.y += asteroid.userData.rotSpeedY;
    asteroid.rotation.z += asteroid.userData.rotSpeedZ;

    // Check collision with ship
    if (!asteroid.userData.hit && Math.abs(asteroid.position.z - ship.position.z) < 2.8) {
      const dx = asteroid.position.x - ship.position.x;
      const dy = asteroid.position.y - ship.position.y;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < asteroid.userData.radius + 1.2) {
        // ASTEROID HIT!
        asteroid.userData.hit = true;
        shield -= 25;
        updateShieldUI();
        sfx.playAsteroidHit();
        triggerFlash('damage');
        cameraShake = 0.55;

        if (shield <= 0) {
          triggerGameOver();
        }
      }
    }

    // Recycle asteroid behind camera
    if (asteroid.position.z > 25) {
      asteroid.position.z = SPAWN_DISTANCE - Math.random() * 80;
      asteroid.position.x = (Math.random() - 0.5) * CORRIDOR_RADIUS_X * 2.2;
      asteroid.position.y = (Math.random() - 0.5) * CORRIDOR_RADIUS_Y * 2.2;
      asteroid.userData.hit = false;
    }
  });

  // 7. Dynamic Camera Follow & Shake
  const targetCamX = ship.position.x * 0.45;
  const targetCamY = ship.position.y * 0.35 + 2.8;
  camera.position.x += (targetCamX - camera.position.x) * 0.12;
  camera.position.y += (targetCamY - camera.position.y) * 0.12;

  // Apply camera shake
  if (cameraShake > 0) {
    camera.position.x += (Math.random() - 0.5) * cameraShake;
    camera.position.y += (Math.random() - 0.5) * cameraShake;
    cameraShake *= 0.9;
    if (cameraShake < 0.01) cameraShake = 0;
  }

  // Camera FOV warp on Boost
  const targetFov = isBoosting ? 76 : 65;
  if (Math.abs(camera.fov - targetFov) > 0.1) {
    camera.fov += (targetFov - camera.fov) * 0.1;
    camera.updateProjectionMatrix();
  }

  camera.lookAt(ship.position.x * 0.2, ship.position.y * 0.2, -15);

  renderer.render(scene, camera);
}

function triggerGameOver() {
  gameState = 'GAMEOVER';
  sfx.playGameOver();

  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem('hyperdrive_best', highScore.toString());
  }

  goScore.textContent = Math.floor(score).toString();
  goRings.textContent = ringsCollected.toString();
  goDistance.textContent = `${(distanceTraveled / 1000).toFixed(1)} KM`;
  goBest.textContent = highScore.toString();

  hud.classList.add('hidden');
  screenGameOver.classList.remove('hidden');
}

animate(performance.now());
