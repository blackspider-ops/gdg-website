import React, { useRef, useMemo, useState, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Environment } from '@react-three/drei';
import * as THREE from 'three';
import { getDeviceConfig, getCanvasConfig } from '@/utils/responsive3D';

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
const getDevicePixelRatio = () => Math.min(window.devicePixelRatio || 1, 2);

// Responsive particle counts - optimized for smooth performance
const getParticleCount = () => {
  if (isMobile()) return 400; // Balanced for mobile
  if (isTablet()) return 700; // Balanced for tablet
  return 1000; // Balanced for desktop
};

// Responsive particle sizes
const getParticleSize = () => {
  if (isMobile()) return 0.025;
  if (isTablet()) return 0.035;
  return 0.045;
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

const GlobalScene = () => {
  const groupRef = useRef<THREE.Group>(null);
  const particleSystemRef = useRef<THREE.Points>(null);
  const { mouse, viewport } = useThree();

  // Performance state
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(true);
  const [scrollY, setScrollY] = useState(0);
  
  // Responsive configuration
  const deviceConfig = useMemo(() => getDeviceConfig(), []);
  
  // Smooth pointer tracking
  const smoothPointer = useMemo(() => new SmoothPointer(), []);
  const noise = useMemo(() => new SimplexNoise(), []);
  const baseZ = useRef(0);
  const parallaxZ = useRef(0);

  // GDG Colors
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

  // Smooth scroll tracking for parallax
  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          setScrollY(window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Particle System with responsive sizing
  const particleGeometry = useMemo(() => {
    const geometry = new THREE.BufferGeometry();
    const particleCount = deviceConfig.particleCount;
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const velocities = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      positions[i3] = (Math.random() - 0.5) * 25;
      positions[i3 + 1] = (Math.random() - 0.5) * 20;
      positions[i3 + 2] = (Math.random() - 0.5) * 20;

      // Random velocities for flow effect
      velocities[i3] = (Math.random() - 0.5) * 0.015;
      velocities[i3 + 1] = (Math.random() - 0.5) * 0.008;
      velocities[i3 + 2] = (Math.random() - 0.5) * 0.015;

      // Random GDG colors
      const colorIndex = Math.floor(Math.random() * gdgColors.length);
      const color = new THREE.Color(gdgColors[colorIndex]);
      colors[i3] = color.r;
      colors[i3 + 1] = color.g;
      colors[i3 + 2] = color.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute('velocity', new THREE.BufferAttribute(velocities, 3));

    return geometry;
  }, [deviceConfig.particleCount, gdgColors]);

  const particleMaterial = useMemo(() => {
    return new THREE.PointsMaterial({
      size: deviceConfig.particleSize,
      vertexColors: true,
      transparent: true,
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true, // Makes particles scale with distance
    });
  }, [deviceConfig.particleSize]);

  // Wireframe Spheres
  const WireframeSphere = ({ position, colorIndex, scale = 1 }: { 
    position: [number, number, number], 
    colorIndex: number,
    scale?: number 
  }) => {
    const meshRef = useRef<THREE.Mesh>(null);

    useFrame((state) => {
      if (meshRef.current && !prefersReducedMotion) {
        const time = state.clock.elapsedTime;
        
        const pulseScale = scale + Math.sin(time * 1.5 + colorIndex) * 0.08;
        meshRef.current.scale.setScalar(pulseScale);
        
        meshRef.current.rotation.x = time * 0.2 + colorIndex;
        meshRef.current.rotation.y = time * 0.15 + colorIndex * 0.3;
        
        meshRef.current.position.y = position[1] + Math.sin(time + colorIndex * 1.5) * 0.2;
      }
    });

    return (
      <mesh ref={meshRef} position={position}>
        <icosahedronGeometry args={[0.8, 1]} />
        <meshBasicMaterial
          color={gdgColors[colorIndex]}
          wireframe
          transparent
          opacity={0.4}
        />
      </mesh>
    );
  };

  // Main animation loop with smooth performance optimization
  useFrame((state) => {
    if (!isTabVisible || prefersReducedMotion) return;
    
    const time = state.clock.elapsedTime;

    // Smooth scroll parallax without glitchy animation changes
    const target = scrollY * deviceConfig.parallaxStrength;
    parallaxZ.current = THREE.MathUtils.lerp(parallaxZ.current, target, 0.08);

    // Animate particle system with consistent performance
    if (particleSystemRef.current) {
      const positions = particleSystemRef.current.geometry.attributes.position.array as Float32Array;
      const velocities = particleSystemRef.current.geometry.attributes.velocity.array as Float32Array;

      smoothPointer.setTarget(mouse.x, mouse.y);
      smoothPointer.update();

      const maxParallax = deviceConfig.maxParallax;

      // Optimized particle animation with reduced noise calculations
      for (let i = 0; i < positions.length; i += 3) {
        // Reduce noise calculation frequency for better performance
        const particleIndex = i / 3;
        const noiseScale = 0.01;
        
        const noiseX = noise.noise2D(time * 0.05 + particleIndex * noiseScale, 0) * 0.0002;
        const noiseY = noise.noise2D(0, time * 0.05 + particleIndex * noiseScale) * 0.0001;
        const noiseZ = noise.noise2D(time * 0.03 + particleIndex * noiseScale, time * 0.03) * 0.0003;
        
        positions[i] += velocities[i] + noiseX;
        positions[i + 1] += velocities[i + 1] + noiseY;
        positions[i + 2] += velocities[i + 2] + noiseZ;

        // Wrap particles
        if (positions[i] > 12) positions[i] = -12;
        if (positions[i] < -12) positions[i] = 12;
        if (positions[i + 1] > 10) positions[i + 1] = -10;
        if (positions[i + 1] < -10) positions[i + 1] = 10;
        if (positions[i + 2] > 10) positions[i + 2] = -10;
        if (positions[i + 2] < -10) positions[i + 2] = 10;

        // Smooth mouse interaction
        const mouseInfluence = 0.0003;
        const distanceX = smoothPointer.current.x * viewport.width * 0.08 - positions[i];
        const distanceY = smoothPointer.current.y * viewport.height * 0.08 - positions[i + 1];
        
        if (Math.abs(distanceX) < 1.5 && Math.abs(distanceY) < 1.5) {
          const cappedInfluenceX = Math.sign(distanceX) * Math.min(Math.abs(distanceX * mouseInfluence), maxParallax / 1000);
          const cappedInfluenceY = Math.sign(distanceY) * Math.min(Math.abs(distanceY * mouseInfluence), maxParallax / 1000);
          positions[i] += cappedInfluenceX;
          positions[i + 1] += cappedInfluenceY;
        }
      }

      particleSystemRef.current.geometry.attributes.position.needsUpdate = true;
      
      // Smooth rotation and positioning
      const rotationSpeed = 0.018;
      particleSystemRef.current.rotation.y = time * rotationSpeed;
      
      const maxMove = maxParallax / 15000;
      particleSystemRef.current.position.x = THREE.MathUtils.clamp(
        smoothPointer.current.x * viewport.width * 0.0008,
        -maxMove,
        maxMove
      );
      particleSystemRef.current.position.y = THREE.MathUtils.clamp(
        smoothPointer.current.y * viewport.height * 0.0008,
        -maxMove,
        maxMove
      );
    }

    // Apply scroll parallax to entire group smoothly
    if (groupRef.current) {
      groupRef.current.position.z = baseZ.current + parallaxZ.current;
      
      // Consistent overall movement
      groupRef.current.rotation.y = time * 0.01;
      groupRef.current.position.x = smoothPointer.current.x * viewport.width * (isMobile() ? 0.0003 : 0.0005);
      groupRef.current.position.y = smoothPointer.current.y * viewport.height * (isMobile() ? 0.0003 : 0.0005);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Particle System */}
      <points ref={particleSystemRef} geometry={particleGeometry} material={particleMaterial} />
      
      {/* Wireframe Spheres */}
      <WireframeSphere position={[-6, 2, -4]} colorIndex={0} scale={0.8} />
      <WireframeSphere position={[5, -1, -3]} colorIndex={1} scale={1.0} />
      <WireframeSphere position={[-3, -3, -5]} colorIndex={2} scale={0.9} />
      <WireframeSphere position={[7, 3, -2]} colorIndex={3} scale={0.7} />
      <WireframeSphere position={[0, 4, -6]} colorIndex={0} scale={0.8} />
      <WireframeSphere position={[-8, 0, -1]} colorIndex={1} scale={0.6} />
      
      {/* Ambient Environment */}
      <Environment preset="night" background={false} />
    </group>
  );
};

const GlobalBackground = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  
  // Get responsive canvas configuration
  const canvasConfig = useMemo(() => getCanvasConfig(), []);

  // Check for reduced motion preference
  useEffect(() => {
    setPrefersReducedMotion(canvasConfig.disableAnimations);
    
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const handleChange = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange);
    } else {
      mediaQuery.addListener(handleChange);
    }
    
    return () => {
      if (mediaQuery.removeEventListener) {
        mediaQuery.removeEventListener('change', handleChange);
      } else {
        mediaQuery.removeListener(handleChange);
      }
    };
  }, [canvasConfig.disableAnimations]);

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        const dpr = Math.min(window.devicePixelRatio, 1.5);
        // Canvas will be resized automatically by R3F
      }
    };

    const resizeObserver = new ResizeObserver(handleResize);
    if (canvasRef.current) {
      resizeObserver.observe(canvasRef.current);
    }

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      resizeObserver.disconnect();
    };
  }, []);

  if (prefersReducedMotion) {
    return (
      <div 
        id="bg-canvas"
        className="fixed inset-0 w-screen h-screen z-0 pointer-events-none bg-gradient-to-b from-background to-card/20"
      />
    );
  }

  return (
    <div 
      id="bg-canvas"
      className="fixed inset-0 w-screen h-screen z-0 pointer-events-none"
    >
      <Canvas
        ref={canvasRef}
        camera={canvasConfig.camera}
        onError={(error) => console.warn('WebGL Error:', error)}
        dpr={canvasConfig.dpr}
        performance={canvasConfig.performance}
        gl={canvasConfig.gl}
      >
        <GlobalScene />
      </Canvas>
    </div>
  );
};

export default GlobalBackground;