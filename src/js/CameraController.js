/**
 * calulcate the camera position, based on mouse position
 * handles the touch events too
 */
import * as THREE from 'three'

export default class CameraController {
    constructor(_options) {
        // Position the camera
        this.targetRotation = new THREE.Vector2();
        this.cursorDelta = new THREE.Vector2(0, 0);

        // Mouse events
        document.addEventListener('mouseenter', (event) => this.mouseenter(event));
        document.addEventListener('mousemove', (event) => this.mousemove(event));

        // Touch events
        document.addEventListener('touchstart', (event) => this.touchstart(event));
        document.addEventListener('touchmove', (event) => this.touchmove(event));

        // Snap camera back after interactions
        document.addEventListener('mouseup', () => { this.moving = false; });
        document.addEventListener('touchend', () => { this.moving = false; });
        document.addEventListener('mousedown', () => { this.moving = true; });
        this.cursorx = 0;
        this.cursory = 0;
        this.moving = false;
    }

    getCursorDelta() {
        return this.cursorDelta;
    }
    mouseenter(event) {
        this.cursorx = event.clientX;
        this.cursory = event.clientY;
    }

    mousemove(event) {
        if (this.moving) {
            this.cursorDelta.x += this.cursorx - event.clientX;
            this.cursorDelta.y += this.cursory - event.clientY;
        }
        this.cursorx = event.clientX;
        this.cursory = event.clientY;
    }

    touchstart(event) {
        const touch = event.touches[0];
        this.cursorx = touch.clientX;
        this.cursory = touch.clientY;

        this.moving = true;
    }

    touchmove(event) {
        const touch = event.touches[0];

        if (this.moving) {
            this.cursorDelta.x += touch.clientX - this.cursorx;
            this.cursorDelta.y += touch.clientY - this.cursory;
        }

        this.cursorx = touch.clientX;
        this.cursory = touch.clientY;
    }

    // Apply the sigmoid function to the value
    smoothLimit(value) {
        return 1 / (1 + Math.exp(-value));
    }

    // get mouse position
    getMousePos() {
        return { 'x': this.cursorx, 'y': this.cursory };
    }

    // given two angles, calculate a 3d point to look into from
    calculateVectorFromAngles(alpha, beta, length) {
        const xComponent = length * Math.cos(alpha) * Math.cos(beta);
        const zComponent = length * Math.sin(alpha) * Math.cos(beta);
        const yComponent = length * Math.sin(beta); // Using sin(y) for z component

        return new THREE.Vector3(xComponent, yComponent, zComponent);
    }

    // return a 3d vector of where the camera should go
    CaluclateCameraVector(deltaTime) {
        let decayFactor = 0.001 / Math.log(deltaTime + 1);
        this.cursorDelta.x = this.cursorDelta.x * decayFactor || 0;
        this.cursorDelta.y = this.cursorDelta.y * decayFactor || 0;

        // play with this one
        const angleX = this.smoothLimit(this.cursorDelta.x * 10) * Math.PI + 4;
        const angleY = this.smoothLimit(this.cursorDelta.y * 10) * Math.PI + .9;

        return this.calculateVectorFromAngles(angleX, angleY, 20);
    }
}