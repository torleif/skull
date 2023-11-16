/**
 * Background.js - creates a starfield to make the background more interesting
 * @see https://www.shadertoy.com/view/tlyGW3
 */

import * as THREE from 'three'
export default class Background {
    constructor(_options) {
        const fragmentShader = `
      
uniform float iTime;
uniform vec3 iResolution;
uniform vec2 iMouse;
uniform vec3 starColor; // Custom star color

#define NUM_LAYERS 2.

mat2 Rot(float a) {
    float s = sin(a);
    float c = cos(a);
    return mat2(c, -s, s, c);
}

float Star(vec2 uv, float flare) {
    float d = length(uv);
    float m = 0.05 / d;

    float rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1000.0));
    m += rays * flare;
    uv *= Rot(3.1415 / 4.0);
    rays = max(0.0, 1.0 - abs(uv.x * uv.y * 1000.0));
    m += rays * 0.3 * flare;

    m *= smoothstep(1.0, 0.2, d);
    return m;
}

float Hash21(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
}

vec3 StarLayer(vec2 uv, float time) {
    vec3 col = vec3(0);

    vec2 gv = fract(uv) - 0.5;
    vec2 id = floor(uv);

    for (int y = -1; y <= 1; y++) {
        for (int x = -1; x <= 1; x++) {
            vec2 offs = vec2(x, y);

            vec2 id_offs = id + offs;
            float n = Hash21(id_offs);
            float size = fract(n * 345.32);

            float star = Star(gv - offs - vec2(n, fract(n * 34.0)) + 0.5, smoothstep(0.9, 1.0, size) * 0.6);

            vec3 color = sin(vec3(0.2, 0.3, 0.9) * fract(n * 2345.2) * 123.2) * 0.5 + 0.5;
            color = color * vec3(1.0, 0.25, 1.0 + size) + vec3(0.2, 0.2, 0.1) * 2.0;

            star *= sin(time * 3.0 + n * 6.2831) * 0.5 + 1.0;
            col += star * size * color;
        }
    }
    return col;
}

void main() {
    vec2 uv = (gl_FragCoord.xy - 0.5 * iResolution.xy) / iResolution.y;
  //  vec2 M = (iMouse.xy - iResolution.xy * 0.5) / iResolution.y;
    vec2 M = vec2(iMouse.x, iMouse.y) / 100.0;

    float t = iTime * 0.02;

   // uv += M * 4.0;

   // uv *= Rot(t);
    vec3 col = vec3(0);

    for (float i = 0.0; i < 1.0; i += 1.0 / NUM_LAYERS) {
        float depth = fract(i + t);

        float scale = mix(20.0, 0.5, depth);
        float fade = depth * smoothstep(1.0, 0.9, depth);
        float color_overlay = 0.4; // how much to apply the tint


       vec3 starLayerColor = StarLayer(uv * scale + i * 453.2 - M, t) * fade; // Get the original star color
       col += starLayerColor * mix(vec3(1.0), starColor, color_overlay); // Apply custom color subtly
    }

    col = pow(col, vec3(0.4545)); // gamma correction

    gl_FragColor = vec4(col, 1.0);
}
        
        `;



        // Create a plane geometry covering the entire screen
        this.planeGeometry = new THREE.PlaneGeometry(2, 2);

        // Create a custom shader material
        this.shaderMaterial = new THREE.ShaderMaterial({
            'fragmentShader': fragmentShader,
            vertexShader: `
                void main() {
                  gl_Position = vec4(position, 1.0);
                }
              `,
            uniforms: {
                iTime: { value: 0.0 },
                iResolution: { value: new THREE.Vector3(1000,1000,100) },
                iMouse: { value: new THREE.Vector2() },
                starColor: { value: new THREE.Color(1, 0, 0) },
            },
        });

        // Create a mesh using the plane geometry and shader material
        this.backgroundMesh = new THREE.Mesh(this.planeGeometry, this.shaderMaterial);
    }

    getBackgroundMesh() {
        return this.backgroundMesh;
    }

    requestAnimationFrameTick() {
        this.shaderMaterial.uniforms.iTime.value += 0.01; // Update time
    }
    updateMouseCursor(pos) {
        this.shaderMaterial.uniforms.iMouse.value = new THREE.Vector2(-pos.x/20,pos.y/20); // Update time
    }

}