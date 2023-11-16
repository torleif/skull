import * as THREE from 'three';
import CameraController from './CameraController.js';
import Background from './Background.js';
import Skull from './Skull.js';


// Set up the scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(
  window.innerWidth / -2 / 200, // Left
  window.innerWidth / 2 / 200,  // Right
  window.innerHeight / 2 / 200, // Top
  window.innerHeight / -2 / 200, // Bottom
  1, 1000 // Near and Far
);
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

var postProcessMaterial = null;


function createFramebufferObject(renderer, width, height) {
  // Step 1: Create a render target (FBO) with the desired width and height
  const renderTarget = new THREE.WebGLRenderTarget(width, height);

  // Step 2: Create a shader material for the post-processing effect
  postProcessMaterial = new THREE.ShaderMaterial({
    vertexShader: ` 
    // Vertex Shader
    varying vec2 vUv;
   // varying vec3 vPosition;
    
    void main() {
        vUv = uv;
       // vPosition = position;
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
        float lacunarity = 2.0;  // Lacunarity controls how quickly the frequency increases
        float persistence = 0.5; // Persistence controls how quickly the amplitude decreases
    
        // Generate fBm displacement for the water surface
        vec2 newvUv = vec2(vUv.x + time / 100., vUv.y);
        float displacement = fBm(vUv, octaves, lacunarity, persistence);
    
        // Apply the displacement to the fragment's position
        vec2 displacedUV = uv + displacement * 0.01; // Adjust the multiplier for the desired effect
    
        // Sample the water texture at the displaced position
        gl_FragColor = texture(myTexture, displacedUV);
      }
    `,
    // Other shader parameters like uniforms can be added here

    uniforms: {
      time: { value: 0.0 }, // Time for animation
      myTexture: { value: null } ,
      uResolution: { value: new THREE.Vector2(window.innerWidth,window.innerHeight) }
    },
  });

  // Step 3: Create a plane geometry to render the post-processing effect
  const planeGeometry = new THREE.PlaneGeometry(2, 2);

  // Step 4: Create a mesh using the geometry and material
  const planeMesh = new THREE.Mesh(planeGeometry, postProcessMaterial);
  planeMesh.frustumCulled = false; // Disable frustum culling for full-screen effects

  // Step 5: Add the mesh to the scene
  scene.add(planeMesh);

  return {
    // The render target to which you'll render your scene
    renderTarget,

    // The mesh used for post-processing
    postProcessMesh: planeMesh,

    // Update function to render to the FBO
    update: () => {
      // Step 6: Render the scene to the FBO
      renderer.setRenderTarget(renderTarget);
      renderer.render(scene, camera);

      // Step 7: Set the render target back to null
      renderer.setRenderTarget(null);

      // Step 8: Optionally, apply the post-processing effect to the screen
      renderer.render(scene, camera);
    },
  };
}


const fbo = createFramebufferObject(renderer, window.innerWidth, window.innerHeight);


// Add a directional light
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(5, 3, 1); // Position the light
directionalLight.name = 'mainDirectionalLight';
scene.add(directionalLight);


const cameraController = new CameraController();
const skull = new Skull();
skull.loadSkull(scene);

// add a background
let background = new Background();
scene.add(background.getBackgroundMesh());


let prevTime = performance.now();
const animateCamera = () => {

  const time = performance.now();
  const deltaTime = time - prevTime;

  const extendedpoint = cameraController.CaluclateCameraVector(deltaTime);
  camera.position.set(extendedpoint.x, extendedpoint.y, extendedpoint.z);

  camera.lookAt(0, 0, 0);
  skull.requestAnimationFrameTick(deltaTime);
  renderer.render(scene, camera);

  let cursorpos = cameraController.getMousePos();
  background.updateMouseCursor({ x: cursorpos.x - window.innerWidth / 2, y: cursorpos.y - window.innerHeight / 2 });
  background.requestAnimationFrameTick();
  requestAnimationFrame(animateCamera);
  fbo.update();

  postProcessMaterial.uniforms.time.value = performance.now() / 1000.0;

  postProcessMaterial.uniforms.myTexture.value = fbo.renderTarget.texture;
};

animateCamera();

// Create an animation function
const animate = () => {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
};

// Call the animation function
animate();
