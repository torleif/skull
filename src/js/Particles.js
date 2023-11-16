/**
 * creates some particles for steam around where the water comes out of
 */

import * as THREE from 'three'

export default class Particles extends THREE.Points {
    constructor(_options) {
        // Create a particle geometry
        const particleGeometry = new THREE.BufferGeometry();

        // Create arrays to hold particle positions and colors
        const particleCount = 10;
        const startalpha= .15;
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const alphas = new Float32Array(particleCount);
        const sizes = new Float32Array(particleCount);

        // Initialize particle positions and colors
        for (let i = 0; i < particleCount; i++) {
            const index = i * 3;

            // Set random particle positions within a range
            positions[index] = (Math.random() - 0.1) * .6 - .2;
            positions[index + 1] = Math.random() * .5;
            positions[index + 2] = (Math.random() - 0.1) * .6 + .6;

            // Set random particle colors (light blue for water)
            colors[index] = 0.5 + Math.random() * 0.5;
            colors[index + 1] = 0.5 + Math.random() * 0.5;
            colors[index + 2] = 1.0; // Blue

            alphas[i] = startalpha; // Fully opaque initially

            sizes[i] = Math.random() * 1.3 + 0.9; // Varying sizes
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particleGeometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Create a particle material
        const particleMaterial = new THREE.ShaderMaterial({
            vertexShader: `attribute float alpha;
  attribute float size;
  varying float vAlpha;
  
  void main() {
      vAlpha = alpha;
      vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
      gl_PointSize = size * (300.0 / length(mvPosition.xyz));
      gl_Position = projectionMatrix * mvPosition;
  }
  `,
            fragmentShader: `

  varying float vAlpha;

  void main() {
      if (length(gl_PointCoord - vec2(0.5)) > 0.5) discard;
      gl_FragColor = vec4(1.0, 1.0, 1.0, vAlpha);
  }`,
            transparent: true,
        });

        super(particleGeometry, particleMaterial);
        this.particleGeometry = particleGeometry;
        this.particleCount = particleCount;
        this.startalpha = startalpha
    }

    animateWaterParticles() {
        const positions = this.particleGeometry.attributes.position.array;
        const alphas = this.particleGeometry.attributes.alpha.array;

        for (let i = 0; i < this.particleCount; i++) {
            const index = i * 3;

            // Update particle positions to simulate upward animation
            positions[index + 1] += 0.004; // You can adjust the speed of the animation here

            alphas[i] -= 0.008; // You can adjust the fade-out speed here

            // Reset particles when they go beyond a certain height
            if (positions[index + 1] > .4) {
                positions[index] = (Math.random() - 0.1) * .7 - .4;
                positions[index + 1] = .3;
                positions[index + 2] = (Math.random() - 0.1) * .7 + .6;
                alphas[i] = this.startalpha; // Reset alpha to fully opaque
            }
        }

        this.particleGeometry.attributes.position.needsUpdate = true;
        this.particleGeometry.attributes.alpha.needsUpdate = true;
    }
}