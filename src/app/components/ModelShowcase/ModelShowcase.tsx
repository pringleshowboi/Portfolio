'use client';

import { useState, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

// Model data for the showcase
const MODELS = [
  {
    id: 'server_rack',
    path: '/models/server_rack.glb',
    label: 'Infrastructure Layer',
    description: 'Enterprise-grade server architecture. The foundation your applications run on.',
    accent: '#00d4ff',
  },
  {
    id: 'check_point_router',
    path: '/models/check_point_router.glb',
    label: 'Perimeter Defense',
    description: 'Check Point Quantum Firewall. Stops threats before they reach your network.',
    accent: '#ff3d6b',
  },
  {
    id: 'splunk_mobile',
    path: '/models/splunk_mobile.glb',
    label: 'Intelligence & Visibility',
    description: 'Splunk SIEM. Every event, every alert, every incident — in one place.',
    accent: '#7b5cfa',
  },
];

// Individual model component with rotation
function Model({ path }: { path: string }) {
  const { scene } = useGLTF(path);
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.3; // Slow Y rotation
    }
  });

  return (
    <group ref={groupRef} scale={[1.5, 1.5, 1.5]}>
      <primitive object={scene} />
    </group>
  );
}

// Preload all models
MODELS.forEach((m) => useGLTF.preload(m.path));

// Scene component for a single model
function ModelScene({ modelIndex }: { modelIndex: number }) {
  const model = MODELS[modelIndex];

  return (
    <>
      <ambientLight intensity={0.4} />
      <pointLight position={[10, 10, 10]} intensity={1} />
      <pointLight position={[-10, -10, -10]} intensity={0.5} />
      <directionalLight position={[0, 5, 5]} intensity={0.8} />
      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableZoom={true}
        enablePan={false}
        minDistance={3}
        maxDistance={15}
      />
      <Suspense fallback={null}>
        <Model path={model.path} />
      </Suspense>
    </>
  );
}

// Navigation dots component
function NavigationDots({
  currentIndex,
  onClick,
}: {
  currentIndex: number;
  onClick: (index: number) => void;
}) {
  return (
    <div className="flex gap-3 absolute bottom-24 left-1/2 -translate-x-1/2 z-20">
      {MODELS.map((model, index) => (
        <button
          key={model.id}
          onClick={() => onClick(index)}
          className={`w-3 h-3 rounded-full transition-all duration-300 ${
            index === currentIndex
              ? 'scale-125'
              : 'opacity-40 hover:opacity-70'
          }`}
          style={{
            backgroundColor: index === currentIndex ? model.accent : '#444',
            boxShadow:
              index === currentIndex ? `0 0 12px ${model.accent}` : 'none',
          }}
          aria-label={`View ${model.label}`}
        />
      ))}
    </div>
  );
}

// Main showcase component
export default function ModelShowcase() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const handleNavigate = (index: number) => {
    if (index === currentIndex || isTransitioning) return;
    setIsTransitioning(true);
    setTimeout(() => {
      setCurrentIndex(index);
      setTimeout(() => setIsTransitioning(false), 400);
    }, 400);
  };

  const handlePrev = () => {
    const prevIndex =
      currentIndex === 0 ? MODELS.length - 1 : currentIndex - 1;
    handleNavigate(prevIndex);
  };

  const handleNext = () => {
    const nextIndex =
      currentIndex === MODELS.length - 1 ? 0 : currentIndex + 1;
    handleNavigate(nextIndex);
  };

  const currentModel = MODELS[currentIndex];

  return (
    <div className="relative w-full h-full">
      {/* 3D Canvas */}
      <div
        className={`absolute inset-0 transition-opacity duration-400 ${
          isTransitioning ? 'opacity-0' : 'opacity-100'
        }`}
      >
        <Canvas camera={{ position: [0, 2, 6], fov: 45 }}>
          <ModelScene modelIndex={currentIndex} />
        </Canvas>
      </div>

      {/* Info Panel - Left side */}
      <div className="absolute left-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-r border-green-900 p-8 flex flex-col justify-center z-10 pointer-events-none">
        <div className="pointer-events-auto">
          <p
            className="text-xs font-mono mb-2 tracking-widest uppercase"
            style={{ color: currentModel.accent }}
          >
            HARDWARE SHOWCASE
          </p>
          <h2
            className="text-2xl md:text-3xl font-bold font-mono mb-4"
            style={{ color: currentModel.accent }}
          >
            {currentModel.label}
          </h2>
          <p className="text-green-400/80 font-mono text-sm md:text-base leading-relaxed max-w-md">
            {currentModel.description}
          </p>

          {/* Navigation arrows */}
          <div className="flex gap-4 mt-8">
            <button
              onClick={handlePrev}
              className="px-6 py-3 border font-mono text-sm transition-colors hover:bg-white/10"
              style={{
                borderColor: currentModel.accent,
                color: currentModel.accent,
              }}
              aria-label="Previous model"
            >
              ← PREV
            </button>
            <button
              onClick={handleNext}
              className="px-6 py-3 border font-mono text-sm transition-colors hover:bg-white/10"
              style={{
                borderColor: currentModel.accent,
                color: currentModel.accent,
              }}
              aria-label="Next model"
            >
              NEXT →
            </button>
          </div>
        </div>
      </div>

      {/* Navigation dots */}
      <NavigationDots
        currentIndex={currentIndex}
        onClick={handleNavigate}
      />

      {/* Section indicator */}
      <div className="absolute top-4 left-4 z-20 font-mono text-green-400 text-xs pointer-events-none">
        <div className="border border-green-800 bg-black/80 p-2">
          <p>{`// HARDWARE SHOWCASE`}</p>
          <p>
            {currentIndex + 1}/{MODELS.length}
          </p>
        </div>
      </div>
    </div>
  );
}