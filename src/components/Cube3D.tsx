import { useRef, useMemo, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';
import { useAppStore } from '../store';

function LED({
  position,
  index,
  isOn,
  planeVisible,
}: {
  position: [number, number, number];
  index: number;
  isOn: boolean;
  planeVisible: boolean;
}) {
  const toggleLed = useAppStore((state) => state.toggleLed);
  const meshRef = useRef<THREE.Mesh>(null);

  // If a plane is invisible, we make it transparent and unclickable
  const materialProps = useMemo(() => {
    if (!planeVisible) {
      return {
        color: '#333333',
        transparent: true,
        opacity: 0.1,
        emissive: '#000000',
        depthWrite: false,
      };
    }

    if (isOn) {
      return {
        color: '#ff0000',
        emissive: '#ff4444',
        emissiveIntensity: 2,
        transparent: true,
        opacity: 0.9,
      };
    }

    return {
      color: '#666666',
      transparent: true,
      opacity: 0.4,
      emissive: '#000000',
    };
  }, [isOn, planeVisible]);

  return (
    <mesh
      ref={meshRef}
      position={position}
      onClick={(e) => {
        if (planeVisible) {
          e.stopPropagation();
          toggleLed(index);
        }
      }}
      visible={true}
    >
      <sphereGeometry args={[0.2, 16, 16]} />
      <meshStandardMaterial {...materialProps} toneMapped={false} />
    </mesh>
  );
}

function CubeFrame() {
  const currentLeds = useAppStore((state) => state.currentLeds);
  const visiblePlanes = useAppStore((state) => state.visiblePlanes);

  const spacing = 1.2;
  const leds = [];

  for (let plane = 0; plane < 4; plane++) {
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 4; col++) {
        // index logic matching typical memory layout: plane * 16 + row * 4 + col
        const index = plane * 16 + row * 4 + col;
        
        // Centering the cube around 0,0,0
        // X = col, Y = plane, Z = row
        const x = (col - 1.5) * spacing;
        const y = (plane - 1.5) * spacing;
        const z = (row - 1.5) * spacing;

        leds.push(
          <LED
            key={index}
            index={index}
            position={[x, y, z]}
            isOn={currentLeds[index]}
            planeVisible={visiblePlanes[plane]}
          />
        );
      }
    }
  }

  // Draw a subtle wireframe box around the cube to help with orientation
  const size = 3 * spacing + 0.6;
  
  return (
    <group>
      <mesh visible={false}>
        <boxGeometry args={[size, size, size]} />
        <meshBasicMaterial color="#ffffff" wireframe transparent opacity={0.1} />
      </mesh>
      
      {/* Base plate marker to show "Bottom" */}
      <mesh position={[0, -1.5 * spacing - 0.4, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[size, size]} />
        <meshBasicMaterial color="#222" side={THREE.DoubleSide} />
      </mesh>

      {leds}
    </group>
  );
}

export function Cube3D() {
  const toggleVisiblePlane = useAppStore((state) => state.toggleVisiblePlane);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Keys 1, 2, 3, 4 map to planes 0, 1, 2, 3 (from bottom to top)
      if (e.key === '1') toggleVisiblePlane(0);
      if (e.key === '2') toggleVisiblePlane(1);
      if (e.key === '3') toggleVisiblePlane(2);
      if (e.key === '4') toggleVisiblePlane(3);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleVisiblePlane]);

  return (
    <div className="w-full h-full relative bg-neutral-900 rounded-lg overflow-hidden">
      <Canvas camera={{ position: [5, 4, 5], fov: 45 }}>
        <color attach="background" args={['#1a1a1a']} />
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 10]} intensity={1} />
        <CubeFrame />
        <OrbitControls makeDefault enablePan={false} />
      </Canvas>
      <div className="absolute top-4 left-4 text-white/50 text-xs font-mono select-none pointer-events-none">
        Z (Rows) ↑<br />
        X (Cols) →<br />
        Y (Planes) ↕
      </div>
    </div>
  );
}
