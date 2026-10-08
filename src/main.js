import Phaser from 'phaser';

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

export class MainScene extends Phaser.Scene {
  constructor() {
    super('MainScene');
  }

  preload() {
    // Generate player texture (jet)
    const gShip = this.make.graphics({ add: false });
    gShip.fillStyle(0x00f0ff, 1);
    gShip.fillTriangle(0, 16, 44, 16, 16, 0);
    gShip.fillStyle(0xff0055, 1);
    gShip.fillTriangle(4, 20, 18, 16, 4, 12);
    gShip.generateTexture('player_jet', 44, 24);

    // Generate smoke particle texture
    const gSmoke = this.make.graphics({ add: false });
    gSmoke.fillStyle(0xffaa00, 1);
    gSmoke.fillCircle(5, 5, 5);
    gSmoke.generateTexture('smoke_particle', 10, 10);

    // Generate neon pillar texture (obstacle)
    const gPillar = this.make.graphics({ add: false });
    gPillar.fillStyle(0x1a1a2e, 1);
    gPillar.fillRoundedRect(0, 0, 52, 700, 6);
    gPillar.lineStyle(3, 0x00ff88, 1);
    gPillar.strokeRoundedRect(0, 0, 52, 700, 6);
    gPillar.generateTexture('neon_gate', 52, 700);
  }

  create() {
    this.state = 'READY';
    this.score = 0;
    this.highScore = parseInt(localStorage.getItem('pocket_high_score') || '0', 10);
    const { width, height } = this.cameras.main;

    // Background starfield (tileSprite for infinite scrolling)
    this.bg = this.add.tileSprite(0, 0, width, height, 'smoke_particle')
      .setOrigin(0, 0)
      .setAlpha(0.2)
      .setTint(0x4466aa);

    // Physics group for obstacles
    this.obstacles = this.physics.add.group();

    // Player jet
    this.player = this.physics.add.sprite(width * 0.25, height / 2, 'player_jet');
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(36, 16);
    this.player.body.setGravityY(0); // Will be set when game starts

    // Particle emitter (smoke trail)
    this.particles = this.add.particles(0, 0, 'smoke_particle', {
      speed: { min: 40, max: 80 },
      lifespan: 250,
      scale: { start: 0.8, end: 0 },
      blendMode: 'ADD',
      follow: this.player,
      followOffset: { x: -20, y: 0 }
    });

    // Score text
    this.scoreText = this.add.text(width / 2, 40, '0', {
      fontSize: '40px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#00ffcc'
    }).setOrigin(0.5).setDepth(10);

    // Prompt text (TAP TO START)
    this.promptText = this.add.text(width / 2, height * 0.7, 'TAP TO FLY', {
      fontSize: '24px',
      fontStyle: 'bold',
      fontFamily: 'sans-serif',
      color: '#ffffff'
    }).setOrigin(0.5).setDepth(10);

    // Input listeners
    this.input.on('pointerdown', () => this.handleInput());
    this.input.keyboard.on('keydown-SPACE', () => this.handleInput());
    this.input.keyboard.on('keydown-UP', () => this.handleInput());

    // Physics overlap between player and obstacles
    this.physics.add.overlap(this.player, this.obstacles, () => this.handleCrash(), null, this);
  }

  handleInput() {
    if (this.state === 'READY') {
      this.state = 'PLAYING';
      this.promptText.setVisible(false);
      this.player.body.setGravityY(950);
      // Start spawning pillars every 1.6 seconds
      this.time.addEvent({ delay: 1600, callback: () => this.spawnPillars(), loop: true });
      // Initial flap
      this.player.setVelocityY(-320);
      this.player.setAngle(-22);
      playSfx('flap');
    } else if (this.state === 'PLAYING') {
      this.player.setVelocityY(-320);
      this.player.setAngle(-22);
      playSfx('flap');
    } else if (this.state === 'GAMEOVER') {
      // Restart the game
      this.scene.restart();
    }
  }

  spawnPillars() {
    if (this.state !== 'PLAYING') return;
    const { width, height } = this.cameras.main;
    const gap = 160;
    const gapY = Phaser.Math.Between(gap, height - gap);

    // Top pillar (origin bottom left)
    const top = this.obstacles.create(width + 40, gapY - gap / 2, 'neon_gate');
    top.setOrigin(0, 1);
    top.setVelocityX(-200);
    top.body.setAllowGravity(false);
    top.body.immovable = true;

    // Bottom pillar (origin top left)
    const bottom = this.obstacles.create(width + 40, gapY + gap / 2, 'neon_gate');
    bottom.setOrigin(0, 0);
    bottom.setVelocityX(-200);
    bottom.body.setAllowGravity(false);
    bottom.body.immovable = true;
    bottom.scored = false; // To detect scoring when passed
  }

  update(time, delta) {
    // Scroll background
    if (this.bg) {
      this.bg.tilePositionX += 1.5;
    }

    if (this.state === 'PLAYING') {
      // Tilt the player based on velocity
      if (this.player.body.velocity.y > 0) {
        // Falling: tilt down
        this.player.angle = Math.min(65, this.player.angle + 2.2);
      } else {
        // Rising or just flapped: tilt up (but we set angle in handleInput, so we can let it gradually fall)
        // We'll let the gravity and the update above handle it.
      }

      // Update obstacles and check for score
      this.obstacles.getChildren().forEach((pillar) => {
        if (pillar.scored === false && pillar.x < this.player.x && pillar.originY === 0) {
          pillar.scored = true;
          this.score += 1;
          this.scoreText.setText(this.score.toString());
          playSfx('score');
        }
        // Remove pillars that are off screen
        if (pillar.x < -60) {
          pillar.destroy();
        }
      });
    }
  }

  handleCrash() {
    if (this.state !== 'PLAYING') return;
    this.state = 'GAMEOVER';
    playSfx('crash');
    this.physics.pause();
    this.particles.stop();

    // Update high score
    if (this.score > this.highScore) {
      this.highScore = this.score;
      localStorage.setItem('pocket_high_score', this.highScore.toString());
    }

    const { width, height } = this.cameras.main;
    // Game Over text
    this.add.text(width / 2, height * 0.45, 'GAME OVER', {
      fontSize: '44px',
      fontStyle: 'bold',
      color: '#ff2255'
    }).setOrigin(0.5).setDepth(20);

    // Update prompt text to show high score and tap to replay
    this.promptText.setText(`BEST: ${this.highScore}  •  TAP TO REPLAY`).setVisible(true).setDepth(20);
  }
}