import * as THREE from 'three';

class NeonRing {
    constructor() {
        this.geometry = new THREE.RingGeometry(1, 1.2, 32);
        this.material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        this.mesh = new THREE.Mesh(this.geometry, this.material);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export default NeonRing;