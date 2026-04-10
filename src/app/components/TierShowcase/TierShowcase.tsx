'use client';

import { useState, useEffect } from 'react';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, Environment, Html } from '@react-three/drei';
import { useGLTF } from '@react-three/drei';
import { motion } from 'framer-motion';

interface TierShowcaseProps {
  tier: string;
  title: string;
  description: string;
  models: Array<{
    name: string;
    position: [number, number, number];
    rotation?: [number, number, number];
    scale?: number;
    color?: string;
  }>;
  onClose: () => void;
}

// Model components
function ServerRack({ position, rotation = [0, 0, 0], scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF('/models/server_rack.glb');
  return (
    <primitive 
      object={scene} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
    />
  );
}

function CheckPointRouter({ position, rotation = [0, 0, 0], scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF('/models/check_point_router.glb');
  return (
    <primitive 
      object={scene} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
    />
  );
}

function SplunkMobile({ position, rotation = [0, 0, 0], scale = 1 }: { position: [number, number, number]; rotation?: [number, number, number]; scale?: number }) {
  const { scene } = useGLTF('/models/splunk_mobile.glb');
  return (
    <primitive 
      object={scene} 
      position={position} 
      rotation={rotation} 
      scale={[scale, scale, scale]}
    />
  );
}

// Scene component
function ShowcaseScene({ models, tier }: { models: TierShowcaseProps['models']; tier: string }) {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setTime(t => t + 0.01), 16);
    return () => clearInterval(interval);
  }, []);

  return (
    <Canvas camera={{ position: [0, 0, 8], fov: 45 }}>
      <ambientLight intensity={0.8} />
      <pointLight position={[5, 5, 5]} color="#00d4ff" intensity={2} />
      <pointLight position={[-5, -5, -5]} color="#ff3d6b" intensity={1.5} />
      <directionalLight position={[0, 10, 0]} intensity={0.5} />
      
      {/* Grid floor */}
      <gridHelper args={[20, 20, '#00d4ff', '#003344']} position={[0, -3, 0]} />
      
      {/* Models */}
      {models.map((model, index) => {
        const ModelComponent = model.name === 'server_rack' ? ServerRack : 
                              model.name === 'check_point_router' ? CheckPointRouter : 
                              SplunkMobile;
        
        return (
          <ModelComponent
            key={index}
            position={model.position}
            rotation={model.rotation}
            scale={model.scale || 1}
          />
        );
      })}

      {/* Floating labels */}
      {models.map((model, index) => (
        <Html key={index} position={[model.position[0], model.position[1] + 2, model.position[2]]}>
          <div className="text-center">
            <div className="text-xs font-mono text-green-400 bg-black/80 px-2 py-1 border border-green-500/50">
              {model.name.replace('_', ' ').toUpperCase()}
            </div>
          </div>
        </Html>
      ))}

      <OrbitControls 
        enableZoom={true} 
        enablePan={true} 
        minDistance={5} 
        maxDistance={20}
        autoRotate={true}
        autoRotateSpeed={0.5}
      />
      <Environment preset="studio" />
    </Canvas>
  );
}

export default function TierShowcase({ tier, title, description, models, onClose }: TierShowcaseProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex justify-between items-center p-6 border-b border-green-800/50 bg-black/90">
        <div>
          <h2 className="text-2xl font-bold text-green-400 font-mono tracking-wider">{tier}</h2>
          <p className="text-white font-bold text-lg">{title}</p>
        </div>
        <button
          onClick={onClose}
          className="px-4 py-2 border border-green-600 text-green-400 hover:bg-green-900/30 font-mono text-sm transition-all"
        >
          {'\u003C'} BACK TO SERVICES
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 relative">
        {/* 3D Scene */}
        <div className="absolute inset-0">
          <ShowcaseScene models={models} tier={tier} />
        </div>

        {/* Overlay Info */}
        <div className="absolute right-0 top-0 w-96 h-full bg-black/80 border-l border-green-800/50 p-6 overflow-y-auto">
          <h3 className="text-green-400 font-bold text-sm mb-4 tracking-widest uppercase">{'//'} TECHNICAL SPECIFICATIONS</h3>
          <p className="text-gray-300 text-sm leading-relaxed mb-6">{description}</p>
          
          <div className="space-y-4">
            <h4 className="text-yellow-400 font-bold text-xs uppercase">{'//'} DEPLOYMENT EXAMPLES</h4>
            <div className="space-y-2 text-xs text-gray-400">
              {models.map((model, index) => (
                <div key={index} className="border-l-2 border-green-800/50 pl-3">
                  <span className="text-green-400 font-bold">{model.name.replace('_', ' ').toUpperCase()}</span>
                  <p className="mt-1">Enterprise-grade {model.name.replace('_', ' ')} deployment with full monitoring and security integration.</p>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-8 space-y-2">
            <h4 className="text-yellow-400 font-bold text-xs uppercase">{'//'} INTEGRATION POINTS</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-400">
              <span className="border border-green-800/50 px-2 py-1">Zero Trust Architecture</span>
              <span className="border border-green-800/50 px-2 py-1">SIEM Integration</span>
              <span className="border border-green-800/50 px-2 py-1">Automated Response</span>
              <span className="border border-green-800/50 px-2 py-1">Compliance Monitoring</span>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}