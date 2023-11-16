/**
 * a kewl skill. creates the animated texture
 * @see https://codepen.io/MrGlox/pen/dypWajW for the noise function used
 */ 

import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
import * as THREE from 'three'
import { Vector3 } from 'three';

export default class Skull {
    constructor(_options) {
        // Provide a DRACOLoader instance to decode compressed mesh data
        this.dracoLoader = new DRACOLoader()
        this.dracoLoader.setDecoderPath('../node_modules/three/examples/js/libs/draco/gltf/');
        this.dracoLoader.setDecoderConfig({ type: 'js' });

        // loads the binary GLTF
        this.loader = new GLTFLoader();
        this.loader.setDRACOLoader(this.dracoLoader);

        // load the fake backed light
        const textureLoader = new THREE.TextureLoader();
        this.bakedlighting = textureLoader.load('bakedLight.png'); 
        this.bakedlighting.flipY = false;
        
        this.leafshader = null;

        // Load the MP4 as a video texture
        this.video = document.createElement('video');
        this.video.src = 'badapple.mp4';
        this.video.loop = true;
        this.video.autoplay = true;

        // play the video as a texture
        this.badapple = new THREE.VideoTexture(this.video);
        this.badapple.minFilter = THREE.LinearFilter;
    }

    loadSkull(scene, fbo) {
        this.loader.load('skull.glb', (gltf) => {
            let bakedlight = new THREE.MeshBasicMaterial({ map: this.bakedlighting });

            const model = gltf.scene;
            scene.add(model);
            this.treematerial = this.createShakingLeavesMaterial();

            // you can set up materials
            model.traverse((o) => {
                switch (o.material ? o.material.name : null) {
                    case 'leaves':
                        o.material = this.treematerial;
                        break;
                    case 'rug':
                    case 'skull':
                    case 'desk':
                    case 'bookshelf':
                        o.material = bakedlight;
                        break;
                    case 'book':
                        o.material = new THREE.MeshStandardMaterial({
                            color: 0x8B4513, // Brown color
                            roughness: 1.0,
                            metalness: 0.2
                        });
                        break;
                    case 'paper':
                        o.material = new THREE.MeshStandardMaterial({
                            color: 0x6c6c6c,
                            roughness: 1,
                        });
                        break;
                    case 'trunk':
                        const trunkMaterial = new THREE.MeshStandardMaterial({
                            color: 0x6A3E1E, // Brown color
                            roughness: 0.75, // Adjust the roughness to control shininess
                            metalness: 0.2 // Adjust the metalness for non-metallic surfaces
                        });
                        o.material = trunkMaterial;
                        break;
                    case 'screen':
                        let screenbadapple = new THREE.MeshBasicMaterial({ map: this.badapple });
                        o.material = screenbadapple;
                        break;
                    case 'water':
                        o.material = this.createWaterShader();
                        fbo.setMeshTarget(o);
                        break;
                    default:
                        // Handle other cases or do nothing
                        break;
                }                
            });
        });

    }

    createShakingLeavesMaterial() {

        // Vertex shader
        const vertexShader = `
        varying vec3 vNormal;
        varying vec2 vUv;
        
        uniform vec3 lightDirection;
        uniform float time; // Time for animation
        
        float wind(float x, float time, float frequency, float amplitude) {
            // Combine multiple sine waves for smoother wind animation
            float windSpeed = 2.5; // Adjust the wind speed
            float windDirection = 1.0; // Adjust the wind direction
            return amplitude * (
                sin(windDirection * (x * frequency + time * windSpeed)) +
                0.5 * sin(windDirection * 2.0 * (x * frequency * 0.5 + time * windSpeed)) +
                0.25 * sin(windDirection * 4.0 * (x * frequency * 0.25 + time * windSpeed))
            );
        }
        
        void main() {
            vNormal = normalize(normalMatrix * normal);
            vUv = uv;
        
            // Calculate wind displacement using wind function
            float windDisplacement = wind(position.x, time, 0.1, 30.0); // Adjust frequency and amplitude
        
            vec3 newPosition = position + vec3(windDisplacement, 0.0, 0.0);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(newPosition, 1.0);
        }
        
        `;

        // Fragment shader
        const fragmentShader = `
            varying vec3 vNormal;
            uniform vec3 lightDirection;
            uniform vec3 baseLeafColor;
            uniform float colorVariation;

            float random(vec3 seed) {
                return fract(sin(dot(seed, vec3(12.9898, 78.233, 45.5432))) * 43758.5453);
            }

            void main() {
                vec3 normal = normalize(vNormal);
                float intensity = dot(normal, -lightDirection);

                // Apply color variation using a random offset for each leaf
                vec3 variation = vec3(random(gl_FragCoord.xyz));
                vec3 leafColor = baseLeafColor  * colorVariation;

                vec3 finalColor = leafColor * max(intensity, 0.0);
                float alpha = smoothstep(0.0, 1.0, intensity);

                gl_FragColor = vec4(finalColor, alpha);
            }`;

        // a fake light position
        const direction = new Vector3(0.8451542547285165, 0.50709255283711, 0.1690308509457033);

        // distance to the fake light source
        const distance = 10.0;

        // Create a ShaderMaterial using the provided shaders
        let leafshader = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                lightDirection: { value: direction.clone().multiplyScalar(-distance) },
                baseLeafColor: { value: new THREE.Color(0.4, 0.5, .2) },
                colorVariation: { value: .1 },
                time: { value: 0.0 } // Time for animation
            },
        });
        leafshader.transparent = true;
        leafshader.alphaTest = 0.5; // Adjust the threshold as needed
        leafshader.blending = THREE.NormalBlending; // Use appropriate blending mode
        this.leafshader = leafshader;
        return leafshader;
    }


    createWaterShader() {
        // Vertex shader
        const vertexShader = ` 
        // Vertex Shader
        varying vec2 vUv;
        varying vec3 vPosition;
        
        void main() {
            vUv = uv;
            vPosition = position;
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        } `;

        // Fragment shader
        const fragmentShader = `
        uniform vec2 uResolution;
        uniform float uTime;
        
        in vec2 vUv;
        
        // A simple 1D noise function (you might need to implement or include this)
        float noise(vec2 p) {
            return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
        }
        
        void main()
        {
            vec2 uv = vUv;
            float time = uTime * 0.4;
        
            vec2 uv_pixel = floor(uv * 64.0) / 64.0;
        
            vec4 col1 = vec4(0.349, 0.486, 0.427, 1.0);
            vec4 col2 = vec4(0.380, 0.584, 0.522, 1.0);
            vec4 col3 = vec4(0.608, 0.792, 0.725, 1.0);
            vec4 col4 = vec4(0.996, 0.992, 0.996, 1.0);
        
            // Use the noise function to generate animated displacement and color
            vec3 displacement = vec3(uv_pixel.x, (uv_pixel.y + time) * 0.1, 0.0);
            displacement += vec3(noise(uv_pixel.xy * 10.0 + time), 0.0, 0.0);
        
            vec4 baseColor = vec4(uv_pixel.x, uv_pixel.y, time, 1.0) +
                             vec4(noise(uv_pixel.xy * 5.0 + time), 0.0, 0.0, 0.0);
        
            vec4 noiseCol = floor(baseColor * 5.0) / 5.0;
            vec4 darkColor   = mix(col1, col2, uv.y);
            vec4 brightColor = mix(col3, col4, uv.y);
            baseColor = mix(darkColor, brightColor, noiseCol);
        
            float inv_uv = 1.0 - uv_pixel.y;
            baseColor.xyz -= pow(uv_pixel.y, 8.0);
            baseColor.a -= 0.2 * pow(uv_pixel.y, 8.0);
            baseColor += pow(inv_uv, 8.0);
            baseColor.a -= 0.2;
        
            gl_FragColor = vec4(baseColor);
        }
        

`;

        // Create a ShaderMaterial using the provided shaders
        let watershader = new THREE.ShaderMaterial({
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            uniforms: {
                uTime: { value: 0.0 }, // Time for animation
                highp: { value: .5 },
                uResolution: { value: new THREE.Vector2(100, 100) },
            },
        });
        // leafshader.side = THREE.FrontSide;
        watershader.transparent = true;
        watershader.alphaTest = 0.5; // Adjust the threshold as needed
        watershader.blending = THREE.NormalBlending; // Use appropriate blending mode
        this.watershader = watershader;
        return watershader;
    }

    // we do this to animate the leaves and the bad apple animation
    requestAnimationFrameTick(deltaTime) {
        if (this.leafshader) {
            this.leafshader.uniforms.time.value = performance.now() / 1000.0;
        }
        if (this.watershader) {
            this.watershader.uniforms.uTime.value = performance.now() / 1000.0;
        }

        if (this.video.readyState === this.video.HAVE_ENOUGH_DATA) {
            this.badapple.needsUpdate = true;
        }
    }
}