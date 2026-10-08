// Three.js 3D Spacecraft Game
import * as THREE from 'three';

// Audio context for synth sounds (optional, but we can keep the skill's audio)
let audioCtx = null;
function playSfx(type) {
  try {
    if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain).connect(audioCtx.destination);
    const t = audioCtx.currentTime;
    if (type === 'flap') {
      osc.frequency.setValueAtTime(340, t);
      osc.frequency.exponentialRampToValueAtTime(620, t + 0.08);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.08);
      osc.start(t); osc.stop(t + 0.08);
    } else if (type === 'score') {
      osc.frequency.setValueAtTime(880, t);
      osc.frequency.setValueAtTime(1320, t + 0.06);
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.14);
      osc.start(t); osc.stop(t + 0.14);
    } else if (type === 'crash') {
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(160, t);
      osc.frequency.exponentialRampToValueAtTime(30, t + 0.25);
      gain.gain.setValueAtTime(0.3, t);
      gain.gain.linearRampToValueAtTime(0, t + 0.25);
      osc.start(t); osc.stop(t + 0.25);
    }
  } catch (e) {}
}

let scene, camera, renderer, spacecraft, starfield, clock;
let isPlaying = false;
let score = 0;
let highScore = parseInt(localStorage.getItem('spacegame_high_score') || '0', 10);
const tunnelRadius = 100;
const tunnelSegments = 200;
const speed = 0.5; // forward speed
let touchStartX = 0, touchStartY = 0;
let shipOffset = new THREE.Vector2(0, 0); // offset from center for ship position
const damping = 0.95; // for smooth movement

// Camera offset for third-person chase view
const cameraOffset = new THREE.Vector3(0, 15, -25); // x, y, z relative to ship
// Camera lag for smooth following
const cameraLerp = 0.1;

// Lights
let ambientLight, directionalLight;

// Ring tunnel
const ringCount = 50;
const rings = [];

function init() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
  // Initial camera position will be set in update based on ship

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  document.getElementById('game').appendChild(renderer.domElement);

  // Add lighting
  addLights();

  // Create spacecraft
  createSpacecraft();

  // Create ring tunnel
  createRingTunnel();

  // Handle window resize
  window.addEventListener('resize', onWindowResize, false);

  // Touch controls
  renderer.domElement.addEventListener('touchstart', onTouchStart, { passive: false });
  renderer.domElement.addEventListener('touchmove', onTouchMove, { passive: false });
  renderer.domElement.addEventListener('touchend', onTouchEnd, { passive: false });

  // Also support mouse for desktop testing
  renderer.domElement.addEventListener('mousedown', onMouseDown, false);
  renderer.domElement.addEventListener('mousemove', onMouseMove, false);
  renderer.domElement.addEventListener('mouseup', onMouseUp, false);
  renderer.domElement.addEventListener('mouseleave', onMouseUp, false);

  clock = new THREE.Clock();

  // Start the game on first touch/click
  renderer.domElement.addEventListener('click', startGame, { once: true });
  renderer.domElement.addEventListener('touchstart', startGame, { once: true });

  animate();
}

function addLights() {
  // Ambient light
  ambientLight = new THREE.AmbientLight(0x404040, 1.5); // soft white light
  scene.add(ambientLight);

  // Directional light (simulating sun)
  directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
  directionalLight.position.set(50, 100, 50); // from top-front
  scene.add(directionalLight);
}

function createSpacecraft() {
  // Fuselage: elongated box
  const fuselageGeometry = new THREE.BoxGeometry(4, 4, 20);
  const fuselageMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    metalness: 0.7,
    roughness: 0.2
  });
  const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);

  // Wings: two thin boxes
  const wingGeometry = new THREE.BoxGeometry(30, 1, 2);
  const wingMaterial = new THREE.MeshStandardMaterial({
    color: 0x00f0ff,
    metalness: 0.5,
    roughness: 0.3
  });
  const leftWing = new THREE.Mesh(wingGeometry, wingMaterial);
  leftWing.position.set(-12, 0, 0);
  const rightWing = new THREE.Mesh(wingGeometry, wingMaterial);
  rightWing.position.set(12, 0, 0);

  // Cockpit: sphere
  const cockpitGeometry = new THREE.SphereGeometry(3, 16, 16);
  const cockpitMaterial = new THREE.MeshStandardMaterial({
    color: 0xff0055,
    metalness: 0.3,
    roughness: 0.1
  });
  const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
  cockpit.position.set(0, 0, 10); // front of fuselage

  // Thrusters: two cones at the back with emissive material
  const thrusterGeometry = new THREE.ConeGeometry(2, 6, 8);
  const thrusterMaterial = new THREE.MeshStandardMaterial({
    color: 0xff4500,
    emissive: 0xff4500,
    emissiveIntensity: 2,
    metalness: 0.2,
    roughness: 0.4
  });
  const leftThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
  leftThruster.position.set(-4, 0, -10);
  leftThruster.rotation.x = Math.PI; // point backward
  const rightThruster = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
  rightThruster.position.set(4, 0, -10);
  rightThruster.rotation.x = Math.PI;

  // Group all parts
  spacecraft = new THREE.Group();
  spacecraft.add(fuselage);
  spacecraft.add(leftWing);
  spacecraft.add(rightWing);
  spacecraft.add(cockpit);
  spacecraft.add(leftThruster);
  spacecraft.add(rightThruster);
  spacecraft.position.z = 0; // start at z=0
  scene.add(spacecraft);
}

function createRingTunnel() {
  // Create a series of rings (torus) spaced along the tunnel
  for (let i = 0; i < ringCount; i++) {
    const segment = (i / ringCount) * tunnelSegments;
    const z = -segment * 10; // spread along negative z

    // Random radius slightly less than tunnelRadius to give room to fly
    const radius = tunnelRadius * (0.7 + Math.random() * 0.3);
    const tube = radius * 0.1; // thickness of the ring
    const radialSegments = 8;
    const tubularSegments = 16;
    const arc = Math.PI * 2; // full circle

    const geometry = new THREE.TorusGeometry(radius, tube, radialSegments, tubularSegments, arc);
    // Use a standard material with emissive for glow
    const color = new THREE.Color(
      Math.random() * 0xffffff
    );
    const material = new THREE.MeshStandardMaterial({
      color: color,
      emissive: color,
      emissiveIntensity: 1.5,
      metalness: 0.2,
      roughness: 0.1,
      transparent: true,
      opacity: 0.8
    });
    const ring = new THREE.Mesh(geometry, material);
    ring.position.z = z;
    ring.rotation.x = Math.PI / 2; // orient to face the camera (along z)
    scene.add(ring);
    rings.push(ring);
  }
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function startGame() {
  isPlaying = true;
  // Reset score and ship offset
  score = 0;
  shipOffset.set(0, 0);
  // Reset spacecraft position
  spacecraft.position.set(0, 0, 0);
  spacecraft.rotation.set(0, 0, 0);
  // Reset rings positions (optional, but we can keep them as is and just move forward)
  // We'll just let them continue; they will be recycled in update
}

function onTouchStart(event) {
  event.preventDefault();
  if (event.touches.length === 1) {
    touchStartX = event.touches[0].clientX;
    touchStartY = event.touches[0].clientY;
  }
}

function onTouchMove(event) {
  event.preventDefault();
  if (event.touches.length === 1 && isPlaying) {
    const touchX = event.touches[0].clientX;
    const touchY = event.touches[0].clientY;
    const deltaX = touchX - touchStartX;
    const deltaY = touchY - touchStartY;

    // Convert to movement: horizontal touch moves ship left/right, vertical moves up/down
    shipOffset.x += deltaX * 0.01;
    shipOffset.y += deltaY * 0.01;

    // Clamp offset to keep ship inside tunnel (with some margin)
    const maxOffset = tunnelRadius * 0.7;
    shipOffset.x = Math.max(-maxOffset, Math.min(maxOffset, shipOffset.x));
    shipOffset.y = Math.max(-maxOffset, Math.min(maxOffset, shipOffset.y));

    touchStartX = touchX;
    touchStartY = touchY;
  }
}

function onTouchEnd() {
  // Optionally, we could add a flap sound on release, but we'll keep it simple.
}

function onMouseDown(event) {
  if (isPlaying) {
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }
}

function onMouseMove(event) {
  if (event.buttons === 1 && isPlaying) {
    const deltaX = event.clientX - touchStartX;
    const deltaY = event.clientY - touchStartY;
    shipOffset.x += deltaX * 0.01;
    shipOffset.y += deltaY * 0.01;
    const maxOffset = tunnelRadius * 0.7;
    shipOffset.x = Math.max(-maxOffset, Math.min(maxOffset, shipOffset.x));
    shipOffset.y = Math.max(-maxOffset, Math.min(maxOffset, shipOffset.y));
    touchStartX = event.clientX;
    touchStartY = event.clientY;
  }
}

function onMouseUp() {
  // nothing
}

function update() {
  if (!isPlaying) return;

  const delta = clock.getDelta();

  // Move rings backward (simulate forward motion)
  for (const ring of rings) {
    ring.position.z += speed;
    // If ring moves too far past the camera, reset it to the front
    if (ring.position.z > 0) {
      // Place it at the far back again
      ring.position.z = -tunnelSegments * 10 - Math.random() * 1000;
      // Optional: randomize radius and color for variety
      const radius = tunnelRadius * (0.7 + Math.random() * 0.3);
      ring.geometry.dispose(); // dispose old geometry
      ring.geometry = new THREE.TorusGeometry(
        radius,
        radius * 0.1,
        8,
        16,
        Math.PI * 2
      );
      const color = new THREE.Color(Math.random() * 0xffffff);
      ring.material.color = color;
      ring.material.emissive = color;
    }
  }

  // Apply damping to ship offset for smooth movement
  shipOffset.multiplyScalar(damping);

  // Update spacecraft position based on offset
  spacecraft.position.x = shipOffset.x;
  spacecraft.position.y = shipOffset.y;

  // Optional: tilt spacecraft based on movement direction
  spacecraft.rotation.z = -shipOffset.x * 0.05; // tilt left/right
  spacecraft.rotation.x = shipOffset.y * 0.05;  // tilt up/down

  // Simple collision detection: if ship gets too close to tunnel walls, crash
  const distanceFromCenter = Math.sqrt(shipOffset.x ** 2 + shipOffset.y ** 2);
  if (distanceFromCenter > tunnelRadius * 0.85) {
    crash();
  }

  // Update score based on forward progress
  score += delta * 10; // increase score over time
  document.getElementById('score').textContent = Math.floor(score);

  // Update camera to follow ship with third-person view
  // Desired camera position: ship position + cameraOffset (transformed by ship's rotation?)
  // For simplicity, we'll keep the offset in world space (not rotated with ship)
  const desiredCameraPos = new THREE.Vector3(
    spacecraft.position.x + cameraOffset.x,
    spacecraft.position.y + cameraOffset.y,
    spacecraft.position.z + cameraOffset.z
  );
  // Smoothly lerp camera position
  camera.position.lerp(desiredCameraPos, cameraLerp);
  // Always look at the ship (or slightly ahead)
  const lookAtPos = new THREE.Vector3(
    spacecraft.position.x,
    spacecraft.position.y,
    spacecraft.position.z + 10 // look a bit forward
  );
  camera.lookAt(lookAtPos);
}

function crash() {
  isPlaying = false;
  playSfx('crash');
  // Update high score
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('spacegame_high_score', highScore.toString());
  }
  // Show game over overlay
  document.getElementById('game-over').style.display = 'flex';
  document.getElementById('final-score').textContent = Math.floor(score);
  document.getElementById('high-score').textContent = highScore;
}

function animate() {
  requestAnimationFrame(animate);
  if (isPlaying) {
    update();
  }
  renderer.render(scene, camera);
}

// Initialize the game
init();

// Add score and game over elements to the DOM (if not already present)
function setupUI() {
  // Score element
  const scoreDiv = document.createElement('div');
  scoreDiv.id = 'score';
  scoreDiv.style.position = 'absolute';
  scoreDiv.style.top = '20px';
  scoreDiv.style.left = '50%';
  scoreDiv.style.transform = 'translateX(-50%)';
  scoreDiv.style.color = '#00ffcc';
  scoreDiv.style.fontSize = '24px';
  scoreDiv.style.fontWeight = 'bold';
  scoreDiv.textContent = '0';
  document.body.appendChild(scoreDiv);

  // Game over overlay
  const gameOverDiv = document.createElement('div');
  gameOverDiv.id = 'game-over';
  gameOverDiv.style.position = 'fixed';
  gameOverDiv.style.top = '0';
  gameOverDiv.style.left = '0';
  gameOverDiv.style.width = '100%';
  gameOverDiv.style.height = '100%';
  gameOverDiv.style.backgroundColor = 'rgba(0,0,0,0.8)';
  gameOverDiv.style.display = 'none';
  gameOverDiv.style.flexDirection = 'column';
  gameOverDiv.style.alignItems = 'center';
  gameOverDiv.style.justifyContent = 'center';
  gameOverDiv.style.color = 'white';
  gameOverDiv.style.fontFamily = 'sans-serif';
  gameOverDiv.style.zIndex = '1000';
  gameOverDiv.innerHTML = `
    <div>
      <h1>GAME OVER</h1>
      <p>Score: <span id="final-score">0</span></p>
      <p>High Score: <span id="high-score">0</span></p>
      <button id="restart-button">TAP TO RESTART</button>
    </div>
  `;
  document.body.appendChild(gameOverDiv);

  // Restart button
  document.getElementById('restart-button').addEventListener('click', () => {
    document.getElementById('game-over').style.display = 'none';
    startGame();
  });
  document.getElementById('restart-button').addEventListener('touchstart', (e) => {
    e.preventDefault();
    document.getElementById('game-over').style.display = 'none';
    startGame();
  });
}
setupUI();