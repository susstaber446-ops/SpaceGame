import * as THREE from 'three';

class Spaceship {
    constructor() {
        this.group = new THREE.Group();
        this.createFuselage();
        this.createWings();
        this.createCockpit();
        this.createThrusters();
    }

    createFuselage() {
        const fuselageGeometry = new THREE.CylinderGeometry(1, 1, 4);
        const fuselageMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const fuselage = new THREE.Mesh(fuselageGeometry, fuselageMaterial);
        this.group.add(fuselage);
    }

    createWings() {
        const wingGeometry = new THREE.BoxGeometry(6, 0.2, 1);
        const wingMaterial = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        const wing = new THREE.Mesh(wingGeometry, wingMaterial);
        wing.position.set(0, 0, -1);
        this.group.add(wing);
    }

    createCockpit() {
        const cockpitGeometry = new THREE.SphereGeometry(0.5);
        const cockpitMaterial = new THREE.MeshStandardMaterial({ color: 0x0000ff });
        const cockpit = new THREE.Mesh(cockpitGeometry, cockpitMaterial);
        cockpit.position.set(0, 2, 0);
        this.group.add(cockpit);
    }

    createThrusters() {
        const thrusterGeometry = new THREE.ConeGeometry(0.3, 1);
        const thrusterMaterial = new THREE.MeshStandardMaterial({ color: 0xff0000 });
        const thruster1 = new THREE.Mesh(thrusterGeometry, thrusterMaterial);
        const thruster2 = thruster1.clone();
        thruster1.position.set(0.5, -1, 0);
        thruster2.position.set(-0.5, -1, 0);
        this.group.add(thruster1);
        this.group.add(thruster2);
    }
}

export default Spaceship;