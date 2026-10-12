import * as THREE from 'three';

class Asteroid {
    constructor(size) {
        const geometry = new THREE.IcosahedronGeometry(size, 0);
        const material = new THREE.MeshStandardMaterial({ color: 0x8b8b8b });
        this.mesh = new THREE.Mesh(geometry, material);
    }

    setPosition(x, y, z) {
        this.mesh.position.set(x, y, z);
    }
}

export default Asteroid;