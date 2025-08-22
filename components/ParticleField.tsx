"use client";

import { useRef, useMemo } from "react";
import { useFrame, useThree, useLoader } from "@react-three/fiber";
import * as THREE from "three";

const PARTICLE_COUNT = 12000;

// Smoothstep helper function
function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  return t * t * (3 - 2 * t);
}

// Create circular particle texture
function createParticleTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 32;
  canvas.height = 32;
  const context = canvas.getContext('2d')!;
  
  // Create gradient from center
  const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
  gradient.addColorStop(0, 'rgba(255,255,255,1)');
  gradient.addColorStop(0.2, 'rgba(255,255,255,0.8)');
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.3)');
  gradient.addColorStop(1, 'rgba(255,255,255,0)');
  
  context.fillStyle = gradient;
  context.fillRect(0, 0, 32, 32);
  
  return new THREE.CanvasTexture(canvas);
}

interface ScrollData {
  position: number;
  velocity: number;
}

export default function ParticleField({ scrollData = { position: 0, velocity: 0 } }: { scrollData?: ScrollData }) {
  const points = useRef<THREE.Points>(null!);
  const { mouse, viewport, camera } = useThree();
  const initialPositions = useRef<Float32Array | null>(null);
  const smoothedPosition = useRef(0);
  const smoothedVelocity = useRef(0);
  const logoPosition = useRef(new THREE.Vector3(0, 0, 0));
  
  const { positions, colors, sizes, particleTexture } = useMemo(() => {
    const positions = new Float32Array(PARTICLE_COUNT * 3);
    const colors = new Float32Array(PARTICLE_COUNT * 3);
    const sizes = new Float32Array(PARTICLE_COUNT);
    
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      
      // More sophisticated distribution with depth layers
      const radius = Math.random() * 25 + 5;
      const theta = Math.random() * Math.PI * 2;
      const phi = (Math.random() - 0.5) * Math.PI;
      
      const x = radius * Math.cos(theta) * Math.cos(phi);
      const y = radius * Math.sin(phi);
      const z = radius * Math.sin(theta) * Math.cos(phi) * 0.6;
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;
      
      // Whitish colors with warm amber particles
      const depth = z / 15 + 0.5; // Normalize depth
      const intensity = Math.random();
      
      if (intensity > 0.90) {
        // Warm amber particles (10%) - emissive for bloom effect
        colors[i3] = 2.0;   // Emissive amber values > 1 for bloom
        colors[i3 + 1] = 1.2;
        colors[i3 + 2] = 0.1;
      } else if (intensity > 0.80) {
        // Warm-white transition (10%) - slightly emissive
        colors[i3] = 1.5;
        colors[i3 + 1] = 1.3;
        colors[i3 + 2] = 1.0;
      } else if (intensity > 0.77) {
        // Slight cool tint for contrast (3%)
        colors[i3] = Math.min(1.0, 0.85 * 1.2);
        colors[i3 + 1] = Math.min(1.0, 0.88 * 1.2);
        colors[i3 + 2] = Math.min(1.0, 0.92 * 1.2);
      } else {
        // Pure white to off-white (majority ~77%)
        const brightness = (0.7 + Math.random() * 0.2) * 1.2; // 20% brighter
        colors[i3] = Math.min(1.0, brightness);
        colors[i3 + 1] = Math.min(1.0, brightness);
        colors[i3 + 2] = Math.min(1.0, brightness);
      }
      
      // Size variation based on depth - warm particles slightly larger
      if (intensity > 0.90) {
        // Amber particles are slightly larger, like they're energized
        sizes[i] = (Math.random() * 0.4 + 0.3) * (1 - depth * 0.3);
      } else {
        sizes[i] = (Math.random() * 0.3 + 0.2) * (1 - depth * 0.3);
      }
    }
    
    // Store initial positions for reference
    initialPositions.current = new Float32Array(positions);
    
    return { 
      positions, 
      colors, 
      sizes,
      particleTexture: createParticleTexture()
    };
  }, []);
  
  useFrame((state) => {
    if (!points.current || !initialPositions.current) return;
    
    const time = state.clock.getElapsedTime();
    const positions = points.current.geometry.attributes.position.array as Float32Array;
    const sizes = points.current.geometry.attributes.size.array as Float32Array;
    
    // Smooth the scroll data internally for jank-free movement
    smoothedPosition.current += (scrollData.position - smoothedPosition.current) * 0.04;
    smoothedVelocity.current += (scrollData.velocity - smoothedVelocity.current) * 0.08;
    
    // Use smoothed values
    const safeScrollData = {
      position: Math.min(1, Math.max(0, smoothedPosition.current)),
      velocity: Math.min(1, Math.max(-1, smoothedVelocity.current))
    };
    
    // Update camera position uniform for distance calculations
    const material = points.current.material as THREE.ShaderMaterial;
    material.uniforms.uCameraPos.value.copy(state.camera.position);
    material.uniforms.uScrollDepth.value = smoothedPosition.current;
    
    // Wave animation with turbulence and scroll effects
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const i3 = i * 3;
      const originalX = initialPositions.current[i3];
      const originalY = initialPositions.current[i3 + 1];
      const originalZ = initialPositions.current[i3 + 2];
      
      // Original wave patterns - these always run
      const waveX = Math.sin(originalX * 0.1 + time * 0.5) * 0.3;
      const waveZ = Math.cos(originalZ * 0.1 + time * 0.3) * 0.2;
      const turbulence = Math.sin(originalY * 0.2 + time * 0.8) * 0.05;
      
      // Breathing effect - always active
      const breathe = Math.sin(time * 0.25) * 0.1 + 1;
      
      // Natural position based on original animation
      const naturalX = originalX + waveX;
      const naturalY = originalY + (waveX + waveZ + turbulence) * 0.008 * breathe;
      const naturalZ = originalZ + waveZ;
      
      // Scroll effects are ADDITIVE to natural movement
      const scrollDriftX = safeScrollData.velocity * originalY * 0.005;
      const scrollDriftY = safeScrollData.velocity * Math.abs(originalX) * 0.002;
      const scrollDriftZ = -safeScrollData.position * 2 + safeScrollData.velocity * 0.3;
      
      // Logo attraction at deep scroll (80%+)
      let logoAttractionX = 0;
      let logoAttractionY = 0;
      let logoAttractionZ = 0;
      
      if (safeScrollData.position > 0.8) {
        const attractionStrength = smoothstep(0.8, 1.0, safeScrollData.position) * 0.3;
        const logoZ = safeScrollData.position * 2; // Logo moves forward with scroll
        
        // Calculate distance to logo position (0, 0, logoZ)
        const distToLogo = Math.sqrt(
          naturalX * naturalX + 
          naturalY * naturalY + 
          (naturalZ - logoZ) * (naturalZ - logoZ)
        );
        
        // Only attract particles within a certain radius
        if (distToLogo < 15) {
          const attractionForce = (1 - distToLogo / 15) * attractionStrength;
          logoAttractionX = -naturalX * attractionForce * 0.2;
          logoAttractionY = -naturalY * attractionForce * 0.2;
          logoAttractionZ = (logoZ - naturalZ) * attractionForce * 0.1;
        }
      }
      
      // Combine all effects
      positions[i3] = naturalX + scrollDriftX + logoAttractionX;
      positions[i3 + 1] = naturalY + scrollDriftY + logoAttractionY;
      positions[i3 + 2] = naturalZ + scrollDriftZ + logoAttractionZ;
      
      // Mouse interaction - particles move away from cursor (more subtle)
      const mouseX = mouse.x * viewport.width * 0.5;
      const mouseY = mouse.y * viewport.height * 0.5;
      const dist = Math.sqrt(
        Math.pow(positions[i3] - mouseX, 2) +
        Math.pow(positions[i3 + 1] - mouseY, 2)
      );
      
      if (dist < 2) {
        const force = (2 - dist) * 0.004;
        positions[i3] += (positions[i3] - mouseX) * force;
        positions[i3 + 1] += (positions[i3 + 1] - mouseY) * force;
      }
      
      // Dynamic size based on camera distance and scroll velocity
      const distToCamera = Math.sqrt(
        Math.pow(positions[i3] - camera.position.x, 2) +
        Math.pow(positions[i3 + 1] - camera.position.y, 2) +
        Math.pow(positions[i3 + 2] - camera.position.z, 2)
      );
      // Very minimal size change
      const velocityScale = 1 + Math.abs(safeScrollData.velocity) * 0.03;
      sizes[i] = (1 - distToCamera / 50) * 0.95 * velocityScale;
    }
    
    points.current.geometry.attributes.position.needsUpdate = true;
    points.current.geometry.attributes.size.needsUpdate = true;
    
    // Natural rotation that always happens
    const naturalRotationY = time * 0.03;
    const naturalRotationX = Math.sin(time * 0.1) * 0.02;
    
    // Add subtle scroll influence on top of natural rotation
    const scrollRotationY = safeScrollData.position * 0.15;
    const scrollRotationX = safeScrollData.velocity * 0.008;
    
    points.current.rotation.y = naturalRotationY + scrollRotationY;
    points.current.rotation.x = naturalRotationX + scrollRotationX;
  });
  
  return (
    <points ref={points}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={PARTICLE_COUNT}
          array={positions}
          itemSize={3}
          args={[positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          count={PARTICLE_COUNT}
          array={colors}
          itemSize={3}
          args={[colors, 3]}
        />
        <bufferAttribute
          attach="attributes-size"
          count={PARTICLE_COUNT}
          array={sizes}
          itemSize={1}
          args={[sizes, 1]}
        />
      </bufferGeometry>
      <shaderMaterial
        transparent
        vertexColors
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        uniforms={{
          pointTexture: { value: particleTexture },
          uCameraPos: { value: new THREE.Vector3() },
          uScrollDepth: { value: 0 }
        }}
        vertexShader={`
          attribute float size;
          varying vec3 vColor;
          varying float vDistance;
          uniform vec3 uCameraPos;
          void main() {
            vColor = color;
            vDistance = distance(position, uCameraPos);
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_PointSize = size * (200.0 / -mvPosition.z);
            gl_Position = projectionMatrix * mvPosition;
          }
        `}
        fragmentShader={`
          uniform sampler2D pointTexture;
          uniform float uScrollDepth;
          varying vec3 vColor;
          varying float vDistance;
          
          vec3 hslToRgb(vec3 hsl) {
            float h = hsl.x;
            float s = hsl.y;
            float l = hsl.z;
            
            float c = (1.0 - abs(2.0 * l - 1.0)) * s;
            float x = c * (1.0 - abs(mod(h * 6.0, 2.0) - 1.0));
            float m = l - c * 0.5;
            
            vec3 rgb;
            if (h < 1.0/6.0) rgb = vec3(c, x, 0.0);
            else if (h < 2.0/6.0) rgb = vec3(x, c, 0.0);
            else if (h < 3.0/6.0) rgb = vec3(0.0, c, x);
            else if (h < 4.0/6.0) rgb = vec3(0.0, x, c);
            else if (h < 5.0/6.0) rgb = vec3(x, 0.0, c);
            else rgb = vec3(c, 0.0, x);
            
            return rgb + vec3(m);
          }
          
          vec3 rgbToHsl(vec3 rgb) {
            float maxVal = max(max(rgb.r, rgb.g), rgb.b);
            float minVal = min(min(rgb.r, rgb.g), rgb.b);
            float l = (maxVal + minVal) * 0.5;
            
            if (maxVal == minVal) {
              return vec3(0.0, 0.0, l);
            }
            
            float d = maxVal - minVal;
            float s = l > 0.5 ? d / (2.0 - maxVal - minVal) : d / (maxVal + minVal);
            
            float h;
            if (maxVal == rgb.r) h = (rgb.g - rgb.b) / d + (rgb.g < rgb.b ? 6.0 : 0.0);
            else if (maxVal == rgb.g) h = (rgb.b - rgb.r) / d + 2.0;
            else h = (rgb.r - rgb.g) / d + 4.0;
            h /= 6.0;
            
            return vec3(h, s, l);
          }
          
          void main() {
            vec2 uv = gl_PointCoord;
            vec4 textureColor = texture2D(pointTexture, uv);
            
            // Base particle color with depth-based temperature shift
            vec3 hsl = rgbToHsl(vColor);
            
            // Subtle temperature shift: cold (blue) at surface -> warm (amber) at depth
            // Max 15% hue shift from blue-white (0.55) to warm-amber (0.08)
            float depthInfluence = smoothstep(0.0, 1.0, uScrollDepth);
            float targetHue = mix(0.55, 0.08, depthInfluence * 0.15);
            
            // Only shift particles that aren't already amber
            if (vColor.r < 1.5) { // Not an amber particle
              hsl.x = mix(hsl.x, targetHue, depthInfluence * 0.15);
              // Slightly increase saturation at depth
              hsl.y = min(1.0, hsl.y + depthInfluence * 0.05);
            }
            
            vec3 shiftedColor = hslToRgb(hsl);
            vec4 baseColor = vec4(shiftedColor, 0.7) * textureColor;
            
            // Slate halo for distant particles - #64748B = rgb(100, 116, 139)
            vec3 slateColor = vec3(0.392, 0.455, 0.545);
            
            // Warm the slate color at depth too
            vec3 warmSlate = mix(slateColor, vec3(0.545, 0.455, 0.392), depthInfluence * 0.3);
            
            // Distance-based slate halo (peaks around distance 20-30)
            float haloStrength = smoothstep(15.0, 30.0, vDistance) * smoothstep(40.0, 25.0, vDistance);
            haloStrength *= 0.3; // Subtle effect
            
            // Create halo effect - larger, softer glow
            float haloDistance = distance(uv, vec2(0.5)) * 2.0;
            float haloAlpha = (1.0 - smoothstep(0.4, 1.2, haloDistance)) * haloStrength;
            
            // Blend slate halo with particle
            vec3 finalColor = mix(baseColor.rgb, warmSlate, haloAlpha * 0.5);
            float finalAlpha = max(baseColor.a, haloAlpha * 0.3);
            
            gl_FragColor = vec4(finalColor, finalAlpha);
            gl_FragColor.rgb *= gl_FragColor.a;
          }
        `}
      />
    </points>
  );
}