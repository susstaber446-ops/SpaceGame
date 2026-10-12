import Spaceship from './Spaceship';
import StarField from './StarField';
import Asteroid from './Asteroid';
import NeonRing from './NeonRing';

class Game {
    constructor() {
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(65, window.innerWidth / window.innerHeight, 0.1, 1000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.spaceship = new Spaceship();
        this.starField = new StarField(5000);
        this.asteroids = [];
        this.neonRings = [];
        this.init();
    }

    init() {
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        document.body.appendChild(this.renderer.domElement);
        this.camera.position.set(0, 2.5, 6);
        this.scene.add(this.spaceship.group);
        this.scene.add(this.starField.stars);
        this.animate();
    }

    animate() {
        requestAnimationFrame(() => this.animate());
        this.renderer.render(this.scene, this.camera);
    }
}

export default Game;