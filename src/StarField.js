import * as THREE from 'three';

class StarField {
    constructor(size) {
        this.size = size;
        this.stars = this.createStars();
    }

    createStars() {
        const starsGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.size * 3);

        for (let i = 0; i < this.size; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 1000;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 1000;
        }

        starsGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        const starsMaterial = new THREE.PointsMaterial({ color: 0xffffff });
        return new THREE.Points(starsGeometry, starsMaterial);
    }
}

export default StarField;