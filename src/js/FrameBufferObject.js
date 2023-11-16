/**
 * This frame buffer saves the image from the render. used for post processing effects,
 * which is used the water
 * @see https://codepen.io/MrGlox/pen/dypWajW (Fractional Brownian motion)
 */
import * as THREE from 'three'

export default class FrameBufferObject {

    constructor(renderer, width, height) {
        this.renderer = renderer;
        this.width = width;
        this.height = height;
        // Step 1: Create a render target (FBO) with the desired width and height
        this.renderTarget = new THREE.WebGLRenderTarget(this.width, this.height);

        // Step 2: Create a shader material for the post-processing effect
        this.postProcessMaterial = new THREE.ShaderMaterial({
            vertexShader: ` 
          varying vec2 vUv;
          
          void main() {
              vUv = uv;
              gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          } `,
            fragmentShader: `
            uniform sampler2D myTexture; // The buffer (texture) used for displacement
            uniform vec2 uResolution; // 
            uniform float time;       // Time for animation
            varying vec2 vUv;
            float hash2(vec2 p) {
                p = fract(p * vec2(134.21, 89.23));
                p *= p + vec2(324.45, 123.94);
                return fract(p.x * p.y * 95.37);
            }
          
            // Fractional Brownian motion
            float noise2(vec2 p) {
                vec2 i = floor(p);
                vec2 f = fract(p);
            
                // Smoothstep for interpolation
                vec2 u = f * f * (3.0 - 2.0 * f);
            
                float a = hash2(i);
                float b = hash2(i + vec2(1.0, 0.0));
                float c = hash2(i + vec2(0.0, 1.0));
                float d = hash2(i + vec2(1.0, 1.0));
            
                float mixAB = mix(a, b, u.x);
                float mixCD = mix(c, d, u.x);
            
                return mix(mixAB, mixCD, u.y) * 2.0 - 1.0;
            }
      
           // Function to generate fractional Brownian motion
            float fBm(vec2 p, int octaves, float lacunarity, float persistence) {
                float total = 0.0 ;
               // float frequency = 3.0 + time;
                float frequency = 40.;
                float amplitude = 1.0 ;
            
                for (int i = 0; i < octaves; i++) {
                    total += amplitude * noise2(p * frequency);
                    frequency *= lacunarity;
                    amplitude *= persistence;
                }
            
                return total;
            }
            
            void main() {
      
              // // Sample the position in the water texture
              vec2 uv = gl_FragCoord.xy / uResolution; // uResolution is a uniform with the screen resolution
          
              // Set up fBm parameters
                int octaves = 1;       // Number of octaves
                float lacunarity = 1.0;  // Lacunarity controls how quickly the frequency increases
                float persistence = 0.5; // Persistence controls how quickly the amplitude decreases
                float waterspeed = 3.0; // lower this number, the faster the water

                // Generate fBm displacement for the water surface
                vec2 newvUv = vec2(vUv.x , vUv.y - time /waterspeed);
                float displacement = fBm(newvUv, octaves, lacunarity, persistence);

                // Apply the displacement to the fragment's position
                vec2 displacedUV = uv + displacement * 0.01; // Adjust the multiplier for the desired effect

                // Sample the water texture at the displaced position
                //gl_FragColor = texture(myTexture, displacedUV);
                vec4 currcolor = texture(myTexture, displacedUV);

                // here we add a blue tinge to the water coming out of the skull mouth
                float distortion = sin(displacedUV.x * 40.0) + 5.0 + sin(displacedUV.y * 30.0) + 3.0;
                vec3 waterColor = vec3(0.0, 0.1, .6); // Adjust the color as needed

                // Apply the water effect to the output color
                vec3 finalColor =  waterColor * distortion;

                gl_FragColor =  currcolor + vec4(finalColor, .3) * .04;
            }
          `,
            // Other shader parameters like uniforms can be added here

            uniforms: {
                time: { value: 0.0 }, // Time for animation
                myTexture: { value: null },
                uResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
            },
        });
    }

    // set the mesh
    setMeshTarget(planeMesh) {
        planeMesh.material = this.postProcessMaterial;
        planeMesh.frustumCulled = false; // Disable frustum culling for full-screen effects
        this.planeMesh = planeMesh;
    }

    // on every update update the water timer
    update(scene, camera) {
        if (!this.renderer) {
            return;
        }
        this.postProcessMaterial.uniforms.time.value = performance.now() / 1000.0;

        this.postProcessMaterial.uniforms.myTexture.value = this.renderTarget.texture;
        this.postProcessMaterial.uniforms.uResolution.value =  new THREE.Vector2(window.innerWidth, window.innerHeight);

        // Step 6: Render the scene to the FBO
        this.renderer.setRenderTarget(this.renderTarget);
        this.renderer.render(scene, camera);

        // Step 7: Set the render target back to null
        this.renderer.setRenderTarget(null);

        // Step 8: Optionally, apply the post-processing effect to the screen
        this.renderer.render(scene, camera);

    }
}