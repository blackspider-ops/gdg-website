import React, { useRef, useMemo } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, ContactShadows, Float } from '@react-three/drei';
import * as THREE from 'three';

const GDGChevrons = () => {
  const groupRef = useRef<THREE.Group>(null);
  const chevronRefs = useRef<THREE.Mesh[]>([]);

  // Create chevron geometry
  const chevronGeometry = useMemo(() => {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.lineTo(0.5, 0.8);
    shape.lineTo(1, 0);
    shape.lineTo(0.8, 0);
    shape.lineTo(0.5, 0.5);
    shape.lineTo(0.2, 0);
    shape.lineTo(0, 0);
    
    const extrudeSettings = {
      depth: 0.1,
      bevelEnabled: true,
      bevelSegments: 2,
      steps: 2,
      bevelSize: 0.02,
      bevelThickness: 0.02,
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, []);

  // Material with subtle metallic look
  const material = useMemo(() => {
    return new THREE.MeshPhysicalMaterial({
      color: new THREE.Color('#4285F4'), // Google Blue for arrows
      metalness: 0.3,
      roughness: 0.4,
      transmission: 0.1,
      thickness: 0.5,
      envMapIntensity: 0.8,
    });
  }, []);

  // Animation loop
  useFrame((state) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = state.clock.elapsedTime * 0.2;
      groupRef.current.rotation.x = Math.sin(state.clock.elapsedTime * 0.5) * 0.1;
    }

    // Individual chevron animations
    chevronRefs.current.forEach((chevron, i) => {
      if (chevron) {
        const time = state.clock.elapsedTime + i * 0.5;
        chevron.position.y = Math.sin(time) * 0.1;
        chevron.rotation.z = Math.sin(time * 0.8) * 0.05;
      }
    });
  });

  return (
    <group ref={groupRef}>
      {/* Create multiple chevrons in a knot formation */}
      {Array.from({ length: 8 }, (_, i) => (
        <mesh
          key={i}
          ref={(el) => {
            if (el) chevronRefs.current[i] = el;
          }}
          geometry={chevronGeometry}
          material={material}
          position={[
            Math.cos((i / 8) * Math.PI * 2) * 2,
            Math.sin((i / 8) * Math.PI * 4) * 0.5,
            Math.sin((i / 8) * Math.PI * 2) * 2,
          ]}
          rotation={[
            Math.PI * 0.5,
            (i / 8) * Math.PI * 2,
            Math.sin((i / 8) * Math.PI * 2) * 0.3,
          ]}
          scale={0.8}
        />
      ))}
      
      {/* Center connecting element */}
      <mesh position={[0, 0, 0]}>
        <torusGeometry args={[1, 0.15, 16, 32]} />
        <meshPhysicalMaterial
          color="#EA4335" // Google Red for ring
          metalness={0.5}
          roughness={0.2}
          envMapIntensity={1}
        />
      </mesh>
    </group>
  );
};

const HeroScene = () => {
  return (
    <div className="hero-canvas">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 45 }}
        gl={{ antialias: true, alpha: true }}
        onError={(error) => console.warn('WebGL Error:', error)}
        dpr={[1, 2]}
      >
        <ambientLight intensity={0.4} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1} 
          castShadow 
        />
        <pointLight position={[-10, -10, -10]} intensity={0.3} color="#52A5FF" />
        <pointLight position={[10, 10, 10]} intensity={0.3} color="#FF5A52" />
        
        <Float
          speed={1.5}
          rotationIntensity={0.5}
          floatIntensity={0.3}
        >
          <GDGChevrons />
        </Float>
        
        <Environment preset="studio" />
        <ContactShadows 
          position={[0, -3, 0]} 
          opacity={0.3} 
          scale={20} 
          blur={2} 
          far={4.5} 
        />
      </Canvas>
    </div>
  );
};

export default HeroScene;