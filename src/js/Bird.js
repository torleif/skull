/**
 * Bird.js - handles the behaviour of a single bird
 * the geometry is a bit more advanced the default three js bird
 */
import * as THREE from 'three';

class Bird extends THREE.Mesh {

    // build a basic 3d bird
    constructor() {
        const vertices = new Float32Array([
            5, 0, 0,
            -5, -2, 1,
            -5, 0, 0,
            -5, -2, -1,
            0, 2, -6,
            0, 2, 6,
            2, 0, 0,
            -3, 0, 0
        ]);

        const indices = [
            0, 2, 1,
            //0, 3, 2,
            4, 7, 6,
            5, 6, 7
        ];
        let geometry = new THREE.BufferGeometry();

        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.BufferAttribute(vertices, 3));

        let material = new THREE.MeshBasicMaterial({
            color: Math.random() * 0xffffff,
            side: THREE.DoubleSide
        })
        super(geometry, material);
        this.phase = Math.floor(Math.random() * 62.83);
        this.geometry = geometry;
        this.material = material;
        this.disturbed_timer = 0;
        this.random_bobbing_time = Math.random();
        this.scale.set(.01, .01, .01)
    }

    // when resting, its head will bob up and down a bit
    calculateBobbing(time) {
        const amplitude = 4; // Adjust the height of the bobbing motion
        const frequency = 0.5; // Adjust the speed of the bobbing
        const sporadicFactor = 1; // Adjust the sporadic factor
    
        const bobbingValue = amplitude * Math.sin(frequency * time * this.random_bobbing_time) * Math.cos(sporadicFactor * time);
    
        return bobbingValue;
    }

    // flap the wings
    updateWing(time) {
        this.phase = (this.phase + (Math.max(0, this.rotation.z) + 0.1)) % 62.83;
        if (this.restingInTree()) {
            // fold wings back
            this.geometry.attributes.position.setZ(4, 0);
            this.geometry.attributes.position.setZ(5, 0);
            this.geometry.attributes.position.setY(4, 5);
            this.geometry.attributes.position.setY(5, 5);
            // bob head
            this.geometry.attributes.position.setY(1, this.calculateBobbing(time));
            this.geometry.attributes.position.needsUpdate = true;
            return;
        }
        this.geometry.attributes.position.setY(1, 0);
        this.geometry.attributes.position.setZ(4, -6);
        this.geometry.attributes.position.setZ(5, 6);
        this.geometry.attributes.position.setY(4, Math.sin(this.phase) * 5);
        this.geometry.attributes.position.setY(5, Math.sin(this.phase) * 5);
        this.geometry.attributes.position.needsUpdate = true;
    }

    disturb() {
        this.disturbed_timer = 1.0;
        this.resting = false;
    }

    isDisturbed() {
        return this.disturbed_timer > 0;
    }

    // based on the time, undisturb the bird
    tick(timedelta) {
        this.disturbed_timer -= timedelta;

        // Ensure the timer doesn't go below zero
        this.disturbed_timer = Math.max(0, this.disturbed_timer);
    }

    // if near a tree. go to rest
    checkrest(position) {
        // allready resting
        if (this.resting) {
            return;
        }
        this.resting = position.distanceTo(this.position) < .3;
    }

    // are you in a tree
    restingInTree() {
        return this.resting;
    }


    updateColor() {
        let color = this.material.color;
        color.r = color.g = color.b = (this.position.z - this.position.x + 2) / 4;
    }

    // Rotate bird as it flies
    faceFlyingDirection(flock, flockscale) {
        this.rotation.y = Math.atan2(-flock.velocity.z, flock.velocity.x);
        this.rotation.z = Math.asin(flock.velocity.y / flock.velocity.length());
        this.position.set(flock.position.x / flockscale, flock.position.y / flockscale, flock.position.z / flockscale);
    }
}

export default Bird;