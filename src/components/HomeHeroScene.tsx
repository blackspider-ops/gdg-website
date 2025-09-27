// Updated hero scene with fixed InteractiveNode references
import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';

// Simplex noise implementation for smooth scaling
class SimplexNoise {
  private grad3 = [
    [1,1,0], [-1,1,0], [1,-1,0], [-1,-1,0],
    [1,0,1], [-1,0,1], [1,0,-1], [-1,0,-1],
    [0,1,1], [0,-1,1], [0,1,-1], [0,-1,-1]
  ];
  private p = Array.from({length: 256}, (_, i) => i);
  private perm = new Array(512);
  private permMod12 = new Array(512);

  constructor() {
    // Shuffle the permutation array
    for (let i = 255; i > 0; i--) {
      const r = Math.floor(Math.random() * (i + 1));
      [this.p[i], this.p[r]] = [this.p[r], this.p[i]];
    }
    
    for (let i = 0; i < 512; i++) {
      this.perm[i] = this.p[i & 255];
      this.permMod12[i] = this.perm[i] % 12;
    }
  }

  private dot(g: number[], x: number, y: number) {
    return g[0] * x + g[1] * y;
  }

  noise2D(xin: number, yin: number): number {
    const F2 = 0.5 * (Math.sqrt(3.0) - 1.0);
    const s = (xin + yin) * F2;
    const i = Math.floor(xin + s);
    const j = Math.floor(yin + s);
    
    const G2 = (3.0 - Math.sqrt(3.0)) / 6.0;
    const t = (i + j) * G2;
    const x0 = xin - (i - t);
    const y0 = yin - (j - t);
    
    let i1, j1;
    if (x0 > y0) { i1 = 1; j1 = 0; }
    else { i1 = 0; j1 = 1; }
    
    const x1 = x0 - i1 + G2;
    const y1 = y0 - j1 + G2;
    const x2 = x0 - 1.0 + 2.0 * G2;
    const y2 = y0 - 1.0 + 2.0 * G2;
    
    const ii = i & 255;
    const jj = j & 255;
    const gi0 = this.permMod12[ii + this.perm[jj]];
    const gi1 = this.permMod12[ii + i1 + this.perm[jj + j1]];
    const gi2 = this.permMod12[ii + 1 + this.perm[jj + 1]];
    
    let t0 = 0.5 - x0 * x0 - y0 * y0;
    let n0 = 0;
    if (t0 >= 0) {
      t0 *= t0;
      n0 = t0 * t0 * this.dot(this.grad3[gi0], x0, y0);
    }
    
    let t1 = 0.5 - x1 * x1 - y1 * y1;
    let n1 = 0;
    if (t1 >= 0) {
      t1 *= t1;
      n1 = t1 * t1 * this.dot(this.grad3[gi1], x1, y1);
    }
    
    let t2 = 0.5 - x2 * x2 - y2 * y2;
    let n2 = 0;
    if (t2 >= 0) {
      t2 *= t2;
      n2 = t2 * t2 * this.dot(this.grad3[gi2], x2, y2);
    }
    
    return 70.0 * (n0 + n1 + n2);
  }
}

// Performance utilities
const isMobile = () => window.innerWidth < 768;
const isTablet = () => window.innerWidth >= 768 && window.innerWidth < 1024;
const isDesktop = () => window.innerWidth >= 1024;
const isLowPowerDevice = () => navigator.hardwareConcurrency <= 4;
const getTargetFPS = () => isLowPowerDevice() ? 30 : 60;
const getDevicePixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

// Responsive particle counts and sizes
const getParticleCount = () => {
  if (isMobile()) return 800;
  if (isTablet()) return 1200;
  return 1500;
};

const getParticleSize = () => {
  if (isMobile()) return 0.03;
  if (isTablet()) return 0.04;
  return 0.05;
};

const getWireframeSphereCount = () => {
  if (isMobile()) return 3;
  if (isTablet()) return 4;
  return 4;
};

const getInteractiveNodeCount = () => {
  if (isMobile()) return 8;
  if (isTablet()) return 10;
  return 12;
};

// Smooth mouse tracking with spring damping
class SmoothPointer {
  current = { x: 0, y: 0 };
  target = { x: 0, y: 0 };
  
  update() {
    const factor = 0.08;
    this.current.x = THREE.MathUtils.lerp(this.current.x, this.target.x, factor);
    this.current.y = THREE.MathUtils.lerp(this.current.y, this.target.y, factor);
  }
  
  setTarget(x: number, y: number) {
    this.target.x = x;
    this.target.y = y;
  }
}

const CyberTechScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const particleSystemRef = useRef<THREE.Points>(null);
  const wireframeSphereRefs = useRef<THREE.Mesh[]>([]);
  const lightTrailRefs = useRef<THREE.Line[]>([]);
  const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
  const { mouse, viewport, camera } = useThree();

  // Performance state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  
  // Smooth pointer tracking
  const smoothPointer = useMemo(() => new SmoothPointer(), []);
  const noise = useMemo(() => new SimplexNoise(), []);

  // GDG Colors with proper opacity for better contrast
  const gdgColors = useMemo(() => ['#52A5FF', '#FF5A52', '#34D399', '#FBBF24'], []);
  const gdgOpacities = [0.55, 0.50, 0.60, 0.45];

  // Check for reduced motion preference
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);
    
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handleChange);
    
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Tab visibility detection
  useEffect(() => {
    const handleVisibilityChange = () => setIsTabVisible(!document.hidden);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  // Particle System with text area avoidance
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = getParticleCount();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);
    const alphas = new Float32Array(particleCount);

    // Responsive text area bounds (approximate hero text position)
    const textArea = { 
      x: 0, 
      y: isMobile() ? 0.5 : 1, 
      width: isMobile() ? 6 : isTablet() ? 7 : 8, 
      height: isMobile() ? 3 : 4 
    };
    const minDistance = isMobile() ? 60 / 50 : 80 / 50; // Convert px to 3D units

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      let x, y, z;
      let attempts = 0;
      
      // Avoid placing particles too close to text area
      do {
        x = (Math.random() - 0.5) * 20;
        y = (Math.random() - 0.5) * 15;
        z = (Math.random() - 0.5) * 15;
        attempts++;
      } while (
        attempts < 10 && 
        Math.abs(x - textArea.x) < textArea.width / 2 + minDistance &&
        Math.abs(y - textArea.y) < textArea.height / 2 + minDistance &&
        z > -2
      );
      
      positions[i3] = x;
      positions[i3 + 1] = y;
      positions[i3 + 2] = z;

      // Random velocities for flow effect
      velocities[i3] = (Math.random() - 0.5) * 0.02;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.01;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.02;

      // Random GDG colors
      const colorIndex = Math.floor(Math.random() * gdgColors.length);
      const color = new THREE.Color(gdgColors[colorIndex]);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
      
      // Set alpha based on distance from text area
      const distanceFromText = Math.sqrt(
        Math.pow(x - textArea.x, 2) + Math.pow(y - textArea.y, 2)
      );
      alphas[i] = Math.min(1, Math.max(0.2, (distanceFromText - minDistance) / minDistance));
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));
    geometry.setAttribute('alpha', new THREE.BufferAttribute(alphas, 1));

    return geometry;
  }, []);

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: getParticleSize(),
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true,
    });
  }, []);

  // Instanced Mesh for Interactive Nodes (squares)
  const { instancedGeometry, instancedMaterial, nodeData } = useMemo(() => {
    const geometry = new THREE.OctahedronGeometry(1, 0);
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0.9,
    });
    
    // Generate node data with base scales and noise seeds
    const nodeCount = getInteractiveNodeCount();
    const data = Array.from({ length: nodeCount }, (_, i) => ({
      position: [
        Math.cos((i / nodeCount) * Math.PI * 2) * (isMobile() ? 3 : isTablet() ? 4 : 5),
        Math.sin((i / nodeCount) * Math.PI * 4) * (isMobile() ? 1.5 : 2),
        Math.sin((i / nodeCount) * Math.PI * 2) * (isMobile() ? 2 : 3),
      ] as [number, number, number],
      colorIndex: i % 4,
      baseScale: isMobile() ? 0.08 : isTablet() ? 0.09 : 0.1,
      noiseSeed: Math.random() * 1000,
    }));
    
    return { instancedGeometry: geometry, instancedMaterial: material, nodeData: data };
  }, []);

  // Wireframe Spheres
  const WireframeSphere = ({ position, colorIndex, scale = 1 }: { 
    position: [number, number, number], 
    colorIndex: number,
    scale?: number 
  }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
      if (meshRef.current) {
        const time = state.clock.elapsedTime;
        
        // Pulsing scale
        const pulseScale = scale + Math.sin(time * 2 + colorIndex) * 0.1;
        meshRef.current.scale.setScalar(pulseScale);
        
        // Gentle rotation
        meshRef.current.rotation.x = time * 0.3 + colorIndex;
        meshRef.current.rotation.y = time * 0.2 + colorIndex * 0.5;
        
        // Floating motion
        meshRef.current.position.y = position[1] + Math.sin(time + colorIndex * 2) * 0.3;
      }
    });

    return (
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[1, 2]} />
        <meshBasicMaterial
          color={gdgColors[colorIndex]}
          wireframe
          transparent
          opacity={0.6}
        />
      </mesh>
    );
  };

  // Light Trails
  const LightTrail = ({ points, colorIndex }: { points: THREE.Vector3[], colorIndex: number }) => {
    const lineRef = useRef<THREE.Line>(null);
    
    const geometry = useMemo(() => {
      return new THREE.BufferGeometry().setFromPoints(points);
    }, [points]);

    useFrame((state) => {
      if (lineRef.current) {
        const time = state.clock.elapsedTime;
        
        // Animate the trail opacity
        const material = lineRef.current.material as THREE.LineBasicMaterial;
        material.opacity = 0.3 + Math.sin(time * 3 + colorIndex) * 0.2;
      }
    });

    return (
      <primitive object={new THREE.Line(geometry, new THREE.LineBasicMaterial({
        color: gdgColors[colorIndex],
        transparent: true,
        opacity: 0.35,
      }))} ref={lineRef} />
    );
  };

  // Create light trail paths
  const lightTrailPaths = useMemo(() => {
    const paths = [];
    for (let i = 0; i < 4; i++) {
      const points = [];
      const radius = 4 + i;
      for (let j = 0; j <= 100; j++) {
        const angle = (j / 100) * Math.PI * 4;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle * 2) * 2;
        const z = Math.sin(angle) * radius * 0.5;
        points.push(new THREE.Vector3(x, y, z));
      }
      paths.push(points);
    }
    return paths;
  }, []);

  // Interactive Nodes using InstancedMesh for performance
  const InstancedNodes = () => {
    const instancedMeshRef = useRef<THREE.InstancedMesh>(null);
    const tempMatrix = useMemo(() => new THREE.Matrix4(), []);
    const tempColor = useMemo(() => new THREE.Color(), []);
    
    useFrame((state) => {
      if (!instancedMeshRef.current || prefersReducedMotion) return;
      
      const time = state.clock.elapsedTime;
      
      // Update smooth pointer
      smoothPointer.setTarget(mouse.x, mouse.y);
      smoothPointer.update();
      
      // Calculate max displacement based on device
      const maxDisplacement = isMobile() ? 15 : isTablet() ? 25 : 40;
      const smoothMouse = {
        x: smoothPointer.current.x * viewport.width * 0.5,
        y: smoothPointer.current.y * viewport.height * 0.5
      };
      
      nodeData.forEach((node, i) => {
        // Noise-based scaling with proper clamping
        const noiseValue = noise.noise2D(
          time * 0.5 + node.noiseSeed,
          node.noiseSeed * 0.1
        );
        const noiseScale = noiseValue * 0.08;
        const scale = THREE.MathUtils.clamp(
          node.baseScale + noiseScale,
          node.baseScale * 0.9,
          node.baseScale * 1.1
        );
        
        // Smooth mouse interaction with easing
        const mouseDistance = Math.sqrt(
          Math.pow(smoothMouse.x - node.position[0], 2) +
          Math.pow(smoothMouse.y - node.position[1], 2)
        );
        
        const interaction = Math.max(0, 1 - mouseDistance / 5);
        const easedInteraction = 1 - Math.pow(1 - interaction, 3); // easeOutCubic
        
        // Apply interaction scaling with limits
        const interactiveScale = scale + easedInteraction * 0.3;
        const finalScale = THREE.MathUtils.clamp(interactiveScale, scale * 0.9, scale * 1.1);
        
        // Position with limited displacement
        const displacement = Math.min(easedInteraction * maxDisplacement / 100, maxDisplacement / 100);
        const position = [
          node.position[0] + (smoothMouse.x - node.position[0]) * displacement * 0.1,
          node.position[1] + (smoothMouse.y - node.position[1]) * displacement * 0.1,
          node.position[2]
        ];
        
        // Rotation based on interaction
        const rotation = time + easedInteraction * 3;
        
        // Set matrix for this instance
        tempMatrix.makeRotationZ(rotation);
        tempMatrix.setPosition(position[0], position[1], position[2]);
        tempMatrix.scale(new THREE.Vector3(finalScale, finalScale, finalScale));
        instancedMeshRef.current!.setMatrixAt(i, tempMatrix);
        
        // Set color for this instance
        const colorIndex = node.colorIndex;
        tempColor.setHex(gdgColors[colorIndex] as any);
        tempColor.multiplyScalar(gdgOpacities[colorIndex] + easedInteraction * 0.2);
        instancedMeshRef.current!.setColorAt(i, tempColor);
      });
      
      instancedMeshRef.current.instanceMatrix.needsUpdate = true;
      if (instancedMeshRef.current.instanceColor) {
        instancedMeshRef.current.instanceColor.needsUpdate = true;
      }
    });

    return (
      <instancedMesh
        ref={instancedMeshRef}
        args={[instancedGeometry, instancedMaterial, nodeData.length]}
      />
    );
  };

  // Main animation loop with performance optimizations
  useFrame((state) => {
    // Skip animation if tab not visible or reduced motion preferred
    if (!isTabVisible || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;

    // Animate particle system with performance limits
    if (particleSystemRef.current) {
      const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;
      const alphas = particleSystemRef.current.geometry.attributes.alpha?.array as Float32Array;

      // Update smooth pointer
      smoothPointer.setTarget(mouse.x, mouse.y);
      smoothPointer.update();

      const maxParallax = isMobile() ? 15 : isTablet() ? 25 : 40;

      for (let i = 0; i < positions.length; i += 3) {
        // Apply velocities with smooth turbulence
        const noiseX = noise.noise2D(time * 0.1 + i * 0.01, 0) * 0.0005;
        const noiseY = noise.noise2D(0, time * 0.1 + i * 0.01) * 0.0003;
        const noiseZ = noise.noise2D(time * 0.05 + i * 0.01, time * 0.05) * 0.0008;
        
        positions[i] += velocities[i] + noiseX;
        positions[i + 1] += velocities[i + 1] + noiseY;
        positions[i + 2] += velocities[i + 2] + noiseZ;

        // Wrap particles around the scene
        if (positions[i] > 10) positions[i] = -10;
        if (positions[i] < -10) positions[i] = 10;
        if (positions[i + 1] > 7) positions[i + 1] = -7;
        if (positions[i + 1] < -7) positions[i + 1] = 7;
        if (positions[i + 2] > 7) positions[i + 2] = -7;
        if (positions[i + 2] < -7) positions[i + 2] = 7;

        // Smooth mouse interaction with capped influence
        const mouseInfluence = 0.0005;
        const distanceX = smoothPointer.current.x * viewport.width * 0.1 - positions[i];
        const distanceY = smoothPointer.current.y * viewport.height * 0.1 - positions[i + 1];
        
        if (Math.abs(distanceX) < 2 && Math.abs(distanceY) < 2) {
          const cappedInfluenceX = Math.sign(distanceX) * Math.min(Math.abs(distanceX * mouseInfluence), maxParallax / 1000);
          const cappedInfluenceY = Math.sign(distanceY) * Math.min(Math.abs(distanceY * mouseInfluence), maxParallax / 1000);
          positions[i] += cappedInfluenceX;
          positions[i + 1] += cappedInfluenceY;
        }

        // Update alpha for particles near text area
        if (alphas) {
          const textDistance = Math.sqrt(
            Math.pow(positions[i], 2) + Math.pow(positions[i + 1] - 1, 2)
          );
          const minDistance = 80 / 50; // Same as in particle generation
          alphas[i / 3] = Math.min(1, Math.max(0.2, (textDistance - minDistance) / minDistance));
        }
      }

      particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      if (alphas) {
        particleSystemRef.current.geometry.attributes.alpha.needsUpdate = true;
      }
      
      // Gentle camera parallax with limits
      if (!prefersReducedMotion) {
        const parallaxStrength = isMobile() ? 0.03 : 0.05;
        particleSystemRef.current.rotation.y = time * parallaxStrength;
        
        const maxParallaxMove = maxParallax / 10000;
        particleSystemRef.current.position.x = THREE.MathUtils.clamp(
          smoothPointer.current.x * viewport.width * 0.001,
          -maxParallaxMove,
          maxParallaxMove
        );
        particleSystemRef.current.position.y = THREE.MathUtils.clamp(
          smoothPointer.current.y * viewport.height * 0.001,
          -maxParallaxMove,
          maxParallaxMove
        );
      }
    }

    // Group parallax effect with smooth transitions
    if (groupRef.current && !prefersReducedMotion) {
      const parallaxFactor = isMobile() ? 0.02 : isTablet() ? 0.035 : 0.05;
      groupRef.current.rotation.x = THREE.MathUtils.lerp(
        groupRef.current.rotation.x,
        smoothPointer.current.y * parallaxFactor,
        0.02
      );
      groupRef.current.rotation.y = time * 0.02 + smoothPointer.current.x * parallaxFactor;
    }
  });

  return (
    <group ref={groupRef}>
      {/* Particle Flow System */}
      <points ref={particleSystemRef} geometry={particleGeometry} material={particleMaterial} />
      
      {/* Responsive Wireframe Spheres */}
      <WireframeSphere position={[-3, 2, -2]} colorIndex={0} scale={isMobile() ? 0.6 : 0.8} />
      <WireframeSphere position={[3, -1, 1]} colorIndex={1} scale={isMobile() ? 0.9 : 1.2} />
      <WireframeSphere position={[0, 3, -1]} colorIndex={2} scale={isMobile() ? 0.5 : 0.6} />
      {!isMobile() && <WireframeSphere position={[-2, -3, 2]} colorIndex={3} scale={1.0} />}
      
      {/* Light Trails */}
      {lightTrailPaths.map((points, i) => (
        <LightTrail key={i} points={points} colorIndex={i} />
      ))}
      
      {/* Interactive Nodes */}
      <InstancedNodes />
    </group>
  );
};

const HomeHeroScene = () => {
  return (
    <div className="absolute inset-0 z-0" style={{ backgroundColor: '#0B0F14' }}>
      <Canvas
        camera={{ position: [0, 0, 10], fov: 40 }}
        onError={(error) => console.warn('WebGL Error:', error)}
        gl={{ 
          antialias: true, 
          alpha: true,
          powerPreference: "high-performance"
        }}
        dpr={[1, Math.min(getDevicePixelRatio(), isLowPowerDevice() ? 1 : 1.5)]}
      >
        {/* Lighting setup for neon glow effect */}
        <ambientLight intensity={0.3} />
        <directionalLight position={[5, 5, 5]} intensity={0.8} />
        <pointLight position={[-10, -10, -5]} intensity={0.4} color="#52A5FF" />
        <pointLight position={[10, 10, 5]} intensity={0.4} color="#FF5A52" />
        <spotLight
          position={[0, 15, 0]}
          angle={0.3}
          penumbra={1}
          intensity={0.5}
          color="#FBBF24"
        />
        
        <CyberTechScene />
        
        <Environment preset="night" />
      </Canvas>
    </div>
  );
};

export default HomeHeroScene;