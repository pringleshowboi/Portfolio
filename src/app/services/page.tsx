'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Points, PointMaterial, Line, Text, MeshReflectorMaterial } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import ChatbotArea from '../components/ChatbotArea/ChatbotArea';
import ModelShowcase from '../components/ModelShowcase/ModelShowcase';
import TierShowcase from '../components/TierShowcase/TierShowcase';

// Color palette
const COLORS = {
  primary: '#00ff41',
  warning: '#ff6600',
  threat: '#ff0000',
  core: '#0066ff',
  bg: '#050a05',
  text: '#00ff41',
  darkBg: '#000000',
};

// ============================================================
// SECTION 1: QUANTUM FIREWALL ARCHITECTURE
// ============================================================

function QuantumFirewallScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [packetPositions, setPacketPositions] = useState<THREE.Vector3[]>([]);
  const [packetColors, setPacketColors] = useState<string[]>([]);
  const [threatNeutralized, setThreatNeutralized] = useState(false);
  const [packetCount, setPacketCount] = useState(0);
  const [burstParticles, setBurstParticles] = useState<{ pos: THREE.Vector3; vel: THREE.Vector3; life: number; color: string }[]>([]);

  const centralNodePos = new THREE.Vector3(0, 0, 0);
  const satellitePositions = [
    new THREE.Vector3(3, 1, 0),
    new THREE.Vector3(2, 2.5, 1),
    new THREE.Vector3(-1, 3, 0),
    new THREE.Vector3(-3, 1, 0),
    new THREE.Vector3(-2, -2.5, 1),
    new THREE.Vector3(1, -3, 0),
    new THREE.Vector3(3, -1, 0),
    new THREE.Vector3(0, 2, -2),
  ];

  // Initialize packets
  useEffect(() => {
    const positions: THREE.Vector3[] = [];
    const colors: string[] = [];
    for (let i = 0; i < 12; i++) {
      const satIdx = i % satellitePositions.length;
      positions.push(satellitePositions[satIdx].clone());
      colors.push(COLORS.primary);
    }
    setPacketPositions(positions);
    setPacketColors(colors);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.1;
    }

    // Animate packets along beams
    setPacketPositions(prev => prev.map((pos, i) => {
      const satIdx = i % satellitePositions.length;
      const direction = centralNodePos.clone().sub(satellitePositions[satIdx]).normalize();
      const newPos = pos.clone().add(direction.multiplyScalar(delta * 2));
      
      // Check if packet reached center
      if (newPos.distanceTo(centralNodePos) < 0.3) {
        // Randomly make one packet malicious
        if (Math.random() < 0.02 && packetColors[i] === COLORS.primary) {
          const newColors = [...packetColors];
          newColors[i] = COLORS.threat;
          setPacketColors(newColors);
        }
        
        // If malicious, create burst effect
        if (packetColors[i] === COLORS.threat) {
          const particles = [];
          for (let j = 0; j < 20; j++) {
            particles.push({
              pos: newPos.clone(),
              vel: new THREE.Vector3(
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5,
                (Math.random() - 0.5) * 5
              ),
              life: 1,
              color: COLORS.threat,
            });
          }
          setBurstParticles(particles);
          setThreatNeutralized(true);
          setTimeout(() => setThreatNeutralized(false), 2000);
          
          // Reset packet
          const newPositions = [...prev];
          newPositions[i] = satellitePositions[satIdx].clone();
          const newColors = [...packetColors];
          newColors[i] = COLORS.primary;
          setPacketColors(newColors);
          return satellitePositions[satIdx].clone();
        }
        
        // Reset packet to satellite
        const newPositions = [...prev];
        newPositions[i] = satellitePositions[satIdx].clone();
        setPacketCount(c => c + 1);
        return satellitePositions[satIdx].clone();
      }
      
      return newPos;
    }));

    // Animate burst particles
    setBurstParticles(prev => prev.map(p => ({
      ...p,
      pos: p.pos.clone().add(p.vel.clone().multiplyScalar(delta)),
      life: p.life - delta * 2,
    })).filter(p => p.life > 0));
  });

  return (
    <group ref={groupRef}>
      {/* Central Firewall Node */}
      <mesh position={centralNodePos}>
        <icosahedronGeometry args={[0.5, 1]} />
        <meshBasicMaterial color={COLORS.primary} wireframe />
      </mesh>
      <mesh position={centralNodePos}>
        <icosahedronGeometry args={[0.3, 0]} />
        <meshBasicMaterial color={COLORS.primary} transparent opacity={0.8} />
      </mesh>
      
      {/* Satellite Nodes */}
      {satellitePositions.map((pos, i) => (
        <group key={i}>
          {/* Connection Line */}
          <Line
            points={[centralNodePos, pos]}
            color={COLORS.primary}
            lineWidth={1}
            transparent
            opacity={0.3}
          />
          {/* Satellite Node */}
          <mesh position={pos}>
            <octahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color={COLORS.primary} wireframe />
          </mesh>
        </group>
      ))}

      {/* Packets */}
      {packetPositions.map((pos, i) => (
        <mesh key={i} position={pos}>
          <boxGeometry args={[0.1, 0.1, 0.1]} />
          <meshBasicMaterial color={packetColors[i]} />
        </mesh>
      ))}

      {/* Burst Particles */}
      {burstParticles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.05, 4, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={p.life} />
        </mesh>
      ))}

      {/* HTML Overlays */}
      <HtmlOverlay
        position={[-3, 3, 0]}
        text="CHECKPOINT_QUANTUM_FIREWALL_V2"
        scale={0.5}
      />
      <HtmlOverlay
        position={[0, -4, 0]}
        text={`PACKETS INSPECTED: ${packetCount}`}
        scale={0.4}
      />
      {threatNeutralized && (
        <HtmlOverlay
          position={[0, 2, 0]}
          text="⚠ THREAT NEUTRALISED"
          scale={0.6}
          color={COLORS.threat}
          flash
        />
      )}
    </group>
  );
}

function HtmlOverlay({ position, text, scale = 0.3, color = COLORS.primary, flash = false }: {
  position: [number, number, number];
  text: string;
  scale?: number;
  color?: string;
  flash?: boolean;
}) {
  const [ref] = useState(() => new THREE.Object3D());
  
  useFrame(() => {
    ref.position.set(...position);
  });

  return (
    <primitive object={ref}>
      <Html position={[0, 0, 0]} center>
        <div
          style={{
            fontFamily: 'monospace',
            fontSize: `${scale * 40}px`,
            color: color,
            textShadow: `0 0 10px ${color}`,
            whiteSpace: 'nowrap',
            animation: flash ? 'pulse 0.5s infinite' : 'none',
            pointerEvents: 'none',
          }}
        >
          {text}
        </div>
      </Html>
    </primitive>
  );
}

// Simple HTML overlay component for Three.js
function Html({ children, position, center }: { children: React.ReactNode; position: [number, number, number]; center?: boolean }) {
  return (
    <group position={position}>
      {/* We'll use a different approach - CSS positioned overlays */}
    </group>
  );
}

// ============================================================
// SECTION 2: ATTACK SIMULATION
// ============================================================

type SimulationPhase = 'normal' | 'attack' | 'defence' | 'logs' | 'stabilize';

function AttackSimulationScene({ triggerSimulation, onPhaseChange }: { triggerSimulation: number; onPhaseChange: (phase: string) => void }) {
  const groupRef = useRef<THREE.Group>(null);
  const [phase, setPhase] = useState<SimulationPhase>('normal');
  const [nodeStates, setNodeStates] = useState<('healthy' | 'infected' | 'isolated' | 'rebuilding')[]>([]);
  const [logs, setLogs] = useState<string[]>([]);
  const [simulationRunning, setSimulationRunning] = useState(false);

  const nodePositions = [
    new THREE.Vector3(0, 0, 0),    // 0: Central firewall
    new THREE.Vector3(2, 1, 0.5),   // 1
    new THREE.Vector3(-1.5, 2, 0),  // 2
    new THREE.Vector3(-2.5, -1, 0), // 3
    new THREE.Vector3(1, -2, 0.5),  // 4
    new THREE.Vector3(3, -0.5, -1), // 5
    new THREE.Vector3(-0.5, 2.5, 0),// 6
    new THREE.Vector3(2.5, 1.5, -0.5), // 7: Entry point
    new THREE.Vector3(-1, -1.5, 0.5),  // 8
    new THREE.Vector3(0.5, -2.5, 0),   // 9
    new THREE.Vector3(-2, 0.5, 0.5),   // 10
    new THREE.Vector3(1.5, -0.5, -1),  // 11
  ];

  // Initialize node states
  useEffect(() => {
    setNodeStates(new Array(12).fill('healthy'));
  }, []);

  // Simulation trigger
  useEffect(() => {
    if (triggerSimulation > 0 && !simulationRunning) {
      runSimulation();
    }
  }, [triggerSimulation]);

  const runSimulation = useCallback(async () => {
    setSimulationRunning(true);
    setLogs([]);
    setNodeStates(new Array(12).fill('healthy'));
    setPhase('normal');
    onPhaseChange('NORMAL STATE - All systems operational');

    // Phase 1: Normal (3 seconds)
    await new Promise(r => setTimeout(r, 3000));
    
    // Phase 2: Attack begins
    setPhase('attack');
    onPhaseChange('⚠ THREAT DETECTED - PHISHING INGRESS NODE_07');
    setNodeStates(prev => {
      const next = [...prev];
      next[7] = 'infected';
      return next;
    });
    setLogs(prev => [...prev, '[18:46:01] THREAT DETECTED: NODE_07']);

    await new Promise(r => setTimeout(r, 1500));
    
    // Spread infection
    setNodeStates(prev => {
      const next = [...prev];
      next[1] = 'infected';
      next[6] = 'infected';
      return next;
    });
    setLogs(prev => [...prev, '[18:46:01] INFECTION SPREADING...']);

    await new Promise(r => setTimeout(r, 1000));

    // Phase 3: Defence activates
    setPhase('defence');
    onPhaseChange('QUANTUM FIREWALL: ACTIVE');
    setLogs(prev => [...prev, 
      '[18:46:02] FIREWALL RULE TRIGGERED: BLOCK',
      '[18:46:02] NODE_07 ISOLATED',
    ]);

    await new Promise(r => setTimeout(r, 500));

    // Isolate nodes
    setNodeStates(prev => {
      const next = [...prev];
      next[7] = 'isolated';
      next[1] = 'isolated';
      next[6] = 'isolated';
      return next;
    });
    setLogs(prev => [...prev, 
      '[18:46:03] LOGGED TO SPLUNK SIEM',
      '[18:46:04] SOAR PLAYBOOK EXECUTED',
    ]);

    await new Promise(r => setTimeout(r, 1500));

    // Phase 4: Logs phase
    setPhase('logs');
    onPhaseChange('ISOLATING COMPROMISED NODES...');
    setLogs(prev => [...prev, '[18:46:05] SYSTEM INTEGRITY: RESTORED']);

    await new Promise(r => setTimeout(r, 1000));

    // Phase 5: Stabilize
    setPhase('stabilize');
    onPhaseChange('ALL SYSTEMS: SECURE');
    setNodeStates(prev => {
      const next = [...prev];
      next[7] = 'rebuilding';
      next[1] = 'rebuilding';
      next[6] = 'rebuilding';
      return next;
    });

    await new Promise(r => setTimeout(r, 2000));

    // Reset to healthy
    setNodeStates(new Array(12).fill('healthy'));
    setPhase('normal');
    setSimulationRunning(false);
  }, [onPhaseChange]);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  const getNodeColor = (state: string, index: number) => {
    if (index === 0) return COLORS.warning; // Central firewall
    switch (state) {
      case 'healthy': return COLORS.primary;
      case 'infected': return COLORS.threat;
      case 'isolated': return '#444444';
      case 'rebuilding': return COLORS.core;
      default: return COLORS.primary;
    }
  };

  return (
    <group ref={groupRef}>
      {/* Nodes */}
      {nodePositions.map((pos, i) => (
        <group key={i}>
          <mesh position={pos}>
            <sphereGeometry args={[i === 0 ? 0.4 : 0.2, 8, 8]} />
            <meshBasicMaterial 
              color={getNodeColor(nodeStates[i] || 'healthy', i)} 
              transparent 
              opacity={nodeStates[i] === 'isolated' ? 0.3 : 0.8}
            />
          </mesh>
          {i === 0 && (
            <mesh position={pos}>
              <sphereGeometry args={[0.5, 8, 8]} />
              <meshBasicMaterial color={COLORS.warning} wireframe transparent opacity={0.3} />
            </mesh>
          )}
        </group>
      ))}

      {/* Connections */}
      {nodePositions.map((pos, i) => {
        if (nodeStates[i] === 'isolated') return null;
        return nodePositions.map((pos2, j) => {
          if (j <= i || nodeStates[j] === 'isolated') return null;
          const connected = Math.random() > 0.6;
          if (!connected) return null;
          return (
            <Line
              key={`${i}-${j}`}
              points={[pos, pos2]}
              color={
                nodeStates[i] === 'infected' || nodeStates[j] === 'infected' 
                  ? COLORS.threat 
                  : COLORS.primary
              }
              lineWidth={1}
              transparent
              opacity={0.2}
            />
          );
        });
      })}

      {/* Log Display */}
      <group position={[4, 0, 0]}>
        {logs.slice(-5).map((log, i) => (
          <HtmlOverlay
            key={i}
            position={[0, 2 - i * 0.5, 0]}
            text={log}
            scale={0.2}
            color={log.includes('THREAT') ? COLORS.threat : COLORS.primary}
          />
        ))}
      </group>

      {/* Phase indicator */}
      <HtmlOverlay
        position={[0, 4, 0]}
        text={`PHASE: ${phase.toUpperCase()}`}
        scale={0.3}
        color={phase === 'attack' ? COLORS.threat : phase === 'defence' ? COLORS.warning : COLORS.primary}
      />
    </group>
  );
}

// ============================================================
// SECTION 3: AI INTELLIGENCE CORE
// ============================================================

function AICoreScene({ jarvisInputTrigger }: { jarvisInputTrigger: number }) {
  const groupRef = useRef<THREE.Group>(null);
  const coreRef = useRef<THREE.Mesh>(null);

  const orbitingNodes = [
    { name: 'SPLUNK', angle: 0, radius: 2 },
    { name: 'CHECKPOINT', angle: Math.PI / 4, radius: 2.5 },
    { name: 'RAG ENGINE', angle: Math.PI / 2, radius: 2 },
    { name: 'LLM LAYER', angle: 3 * Math.PI / 4, radius: 2.8 },
    { name: 'SOAR', angle: Math.PI, radius: 2.2 },
    { name: 'THREAT FEED', angle: 5 * Math.PI / 4, radius: 2.6 },
    { name: 'IDENTITY', angle: 3 * Math.PI / 2, radius: 2.1 },
    { name: 'CLOUD', angle: 7 * Math.PI / 4, radius: 2.4 },
  ];

  const outputCards = [
    { name: 'ALERT', position: new THREE.Vector3(3, 2, 0) },
    { name: 'BLOCK', position: new THREE.Vector3(-3, 2, 0) },
    { name: 'LOG', position: new THREE.Vector3(0, -3, 1) },
    { name: 'REPORT', position: new THREE.Vector3(0, 3, -1) },
  ];

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.05;
    }
    
    // Pulse core when JARVIS input
    if (coreRef.current) {
      const pulse = Math.sin(state.clock.elapsedTime * 2) * 0.1 + 0.9;
      coreRef.current.scale.setScalar(pulse);
    }
  });

  // Pulse brighter on JARVIS input
  useEffect(() => {
    if (jarvisInputTrigger > 0 && coreRef.current) {
      coreRef.current.material = new THREE.MeshBasicMaterial({
        color: '#00ffff',
        transparent: true,
        opacity: 1,
      });
      setTimeout(() => {
        if (coreRef.current) {
          coreRef.current.material = new THREE.MeshBasicMaterial({
            color: COLORS.core,
            transparent: true,
            opacity: 0.8,
          });
        }
      }, 500);
    }
  }, [jarvisInputTrigger]);

  return (
    <group ref={groupRef}>
      {/* Central AI Core */}
      <mesh ref={coreRef} position={[0, 0, 0]}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial color={COLORS.core} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.2, 16, 16]} />
        <meshBasicMaterial color={COLORS.core} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Orbiting Nodes */}
      {orbitingNodes.map((node, i) => {
        const x = Math.cos(node.angle + Date.now() * 0.001) * node.radius;
        const z = Math.sin(node.angle + Date.now() * 0.001) * node.radius;
        
        return (
          <group key={i}>
            {/* Connection beam to core */}
            <Line
              points={[new THREE.Vector3(0, 0, 0), new THREE.Vector3(x, 0, z)]}
              color={COLORS.core}
              lineWidth={1}
              transparent
              opacity={0.3}
            />
            {/* Node */}
            <mesh position={[x, 0, z]}>
              <dodecahedronGeometry args={[0.2, 0]} />
              <meshBasicMaterial color={COLORS.primary} />
            </mesh>
            {/* Label */}
            <HtmlOverlay
              position={[x, 0.4, z]}
              text={node.name}
              scale={0.15}
            />
          </group>
        );
      })}

      {/* Output Cards */}
      {outputCards.map((card, i) => (
        <group key={i} position={card.position}>
          <mesh>
            <boxGeometry args={[0.6, 0.4, 0.05]} />
            <meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={0.5} />
          </mesh>
          {/* Beam from core to card */}
          <Line
            points={[new THREE.Vector3(0, 0, 0), card.position]}
            color={COLORS.warning}
            lineWidth={1}
            transparent
            opacity={0.2}
          />
          <HtmlOverlay
            position={[0, 0, 0]}
            text={card.name}
            scale={0.2}
          />
        </group>
      ))}

      {/* Status overlays */}
      <HtmlOverlay position={[-4, 3, 0]} text="AI_CORE: PROCESSING" scale={0.25} />
      <HtmlOverlay position={[-4, 2, 0]} text="MODELS ACTIVE: 3" scale={0.2} />
      <HtmlOverlay position={[-4, 1, 0]} text="RESPONSE LATENCY: 180ms" scale={0.2} />
    </group>
  );
}

// ============================================================
// SECTION 4: LAYERED FORTRESS
// ============================================================

function LayeredFortressScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [selectedLayer, setSelectedLayer] = useState<number | null>(null);

  const layers = [
    { name: 'USER DEVICES / MOBILE', y: 3, color: COLORS.primary },
    { name: 'HARMONY ENDPOINT + MDM', y: 2, color: '#00cc33' },
    { name: 'API GATEWAY / ZERO TRUST', y: 1, color: COLORS.warning },
    { name: 'BACKEND SERVICES', y: 0, color: COLORS.core },
    { name: 'CHECK POINT CLOUDGUARD', y: -1, color: '#0055ff' },
    { name: 'SPLUNK MONITORING', y: -2, color: '#ff6600' },
  ];

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.03;
    }
  });

  const handleLayerClick = (index: number) => {
    setSelectedLayer(selectedLayer === index ? null : index);
  };

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => {
        const isSelected = selectedLayer === i;
        const expandX = isSelected ? 1.5 : 1;
        const expandZ = isSelected ? 1.5 : 1;
        
        return (
          <group key={i} position={[0, layer.y, 0]}>
            {/* Layer Platform */}
            <mesh 
              position={[0, 0, 0]} 
              scale={[expandX, 0.05, expandZ]}
              onClick={() => handleLayerClick(i)}
            >
              <boxGeometry args={[3, 0.1, 1.5]} />
              <meshBasicMaterial 
                color={layer.color} 
                wireframe={!isSelected}
                transparent 
                opacity={isSelected ? 0.8 : 0.3}
              />
            </mesh>
            
            {/* Layer Label */}
            <HtmlOverlay
              position={[2.5, 0, 0]}
              text={layer.name}
              scale={0.15}
              color={isSelected ? '#ffffff' : layer.color}
            />

            {/* Scan beams for specific layers */}
            {i === 1 && (
              <mesh position={[0, 0.2, 0]}>
                <planeGeometry args={[3, 0.1]} />
                <meshBasicMaterial color={COLORS.primary} transparent opacity={0.3} />
              </mesh>
            )}

            {/* Connection lines between layers */}
            {i < layers.length - 1 && (
              <Line
                points={[
                  new THREE.Vector3(0, 0, 0),
                  new THREE.Vector3(0, layers[i + 1].y - layer.y, 0)
                ]}
                color={layer.color}
                lineWidth={1}
                transparent
                opacity={0.2}
              />
            )}
          </group>
        );
      })}

      {/* Floating device icons for top layer */}
      <mesh position={[-1, 3.5, 0.5]}>
        <boxGeometry args={[0.3, 0.5, 0.05]} />
        <meshBasicMaterial color={COLORS.primary} wireframe />
      </mesh>
      <mesh position={[1, 3.5, -0.5]}>
        <boxGeometry args={[0.4, 0.3, 0.05]} />
        <meshBasicMaterial color={COLORS.primary} wireframe />
      </mesh>
    </group>
  );
}

// ============================================================
// SECTION 5: SPLUNK DATA STORM
// ============================================================

function SplunkDataStormScene() {
  const groupRef = useRef<THREE.Group>(null);
  const [eventsPerSec, setEventsPerSec] = useState(0);
  const [alertsToday, setAlertsToday] = useState(847);
  const [mttr, setMttr] = useState(4.2);
  const [anomalyActive, setAnomalyActive] = useState(false);

  const sourceNodes = [
    { name: 'FIREWALL', position: new THREE.Vector3(-4, 2, 0) },
    { name: 'ENDPOINTS', position: new THREE.Vector3(-3, -2, 1) },
    { name: 'CLOUD', position: new THREE.Vector3(-2, 3, -1) },
    { name: 'IDENTITY', position: new THREE.Vector3(-4, -1, 1) },
    { name: 'NETWORK', position: new THREE.Vector3(-3, 0, -2) },
    { name: 'APPS', position: new THREE.Vector3(-2, -3, 0) },
  ];

  const splunkCorePos = new THREE.Vector3(0, 0, 0);

  // Simulate particle flow
  const [particles, setParticles] = useState<{ pos: THREE.Vector3; target: THREE.Vector3; speed: number; color: string }[]>([]);

  useEffect(() => {
    const initialParticles: typeof particles = [];
    for (let i = 0; i < 100; i++) {
      const sourceIdx = Math.floor(Math.random() * sourceNodes.length);
      initialParticles.push({
        pos: sourceNodes[sourceIdx].position.clone(),
        target: splunkCorePos.clone(),
        speed: 2 + Math.random() * 3,
        color: Math.random() < 0.05 ? COLORS.threat : COLORS.primary,
      });
    }
    setParticles(initialParticles);
  }, []);

  useFrame((state, delta) => {
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.02;
    }

    // Update particles
    setParticles(prev => prev.map(p => {
      const direction = p.target.clone().sub(p.pos).normalize();
      const newPos = p.pos.clone().add(direction.multiplyScalar(p.speed * delta));
      
      // Reset if reached core
      if (newPos.distanceTo(p.target) < 0.5) {
        const sourceIdx = Math.floor(Math.random() * sourceNodes.length);
        return {
          ...p,
          pos: sourceNodes[sourceIdx].position.clone(),
          color: Math.random() < 0.05 ? COLORS.threat : COLORS.primary,
        };
      }
      
      return { ...p, pos: newPos };
    }));

    // Update counters
    setEventsPerSec(Math.floor(1000 + Math.random() * 500));
    
    // Random anomaly
    if (Math.random() < 0.001) {
      setAnomalyActive(true);
      setTimeout(() => setAnomalyActive(false), 3000);
    }
  });

  return (
    <group ref={groupRef}>
      {/* Splunk Core */}
      <mesh position={splunkCorePos}>
        <sphereGeometry args={[1, 32, 32]} />
        <meshBasicMaterial 
          color={anomalyActive ? COLORS.threat : COLORS.warning} 
          transparent 
          opacity={0.6} 
        />
      </mesh>
      <mesh position={splunkCorePos}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshBasicMaterial color={COLORS.warning} wireframe transparent opacity={0.2} />
      </mesh>

      {/* Source Nodes */}
      {sourceNodes.map((node, i) => (
        <group key={i} position={node.position}>
          <mesh>
            <octahedronGeometry args={[0.2, 0]} />
            <meshBasicMaterial color={COLORS.primary} />
          </mesh>
          <HtmlOverlay
            position={[0, 0.4, 0]}
            text={node.name}
            scale={0.15}
          />
        </group>
      ))}

      {/* Data Particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p.pos}>
          <sphereGeometry args={[0.03, 4, 4]} />
          <meshBasicMaterial color={p.color} />
        </mesh>
      ))}

      {/* Floating Dashboard Panels */}
      <group position={[3, 2, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 1, 0.05]} />
          <meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={0.3} />
        </mesh>
        <HtmlOverlay position={[0, 0, 0.1]} text={`EVENTS/SEC: ${eventsPerSec}`} scale={0.15} />
      </group>

      <group position={[3, 0, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.6, 0.05]} />
          <meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={0.3} />
        </mesh>
        <HtmlOverlay position={[0, 0, 0.1]} text={`ALERTS TODAY: ${alertsToday}`} scale={0.15} />
      </group>

      <group position={[3, -2, 0]}>
        <mesh>
          <boxGeometry args={[1.5, 0.6, 0.05]} />
          <meshBasicMaterial color={COLORS.primary} wireframe transparent opacity={0.3} />
        </mesh>
        <HtmlOverlay position={[0, 0, 0.1]} text={`MTTR: ${mttr} MIN`} scale={0.15} />
      </group>

      {/* Anomaly Alert */}
      {anomalyActive && (
        <HtmlOverlay
          position={[0, 3, 0]}
          text="⚠ ANOMALY DETECTED - PLAYBOOK TRIGGERED"
          scale={0.25}
          color={COLORS.threat}
          flash
        />
      )}
    </group>
  );
}

// ============================================================
// MAIN SERVICES PAGE
// ============================================================

export default function ServicesPage() {
  const router = useRouter();
  const [activeSection, setActiveSection] = useState(0);
  const [simTrigger, setSimTrigger] = useState(0);
  const [simPhase, setSimPhase] = useState('');
  const [jarvisTrigger, setJarvisTrigger] = useState(0);
  const [showTierShowcase, setShowTierShowcase] = useState(false);
  const [selectedTier, setSelectedTier] = useState<{
    tier: string;
    title: string;
    description: string;
    models: Array<{
      name: string;
      position: [number, number, number];
      rotation?: [number, number, number];
      scale?: number;
    }>;
  } | null>(null);
  const sectionsRef = useRef<HTMLDivElement[]>([]);

  // Intersection Observer for scroll detection
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const index = parseInt(entry.target.getAttribute('data-index') || '0');
            setActiveSection(index);
          }
        });
      },
      { threshold: 0.5 }
    );

    sectionsRef.current.forEach((section) => {
      if (section) observer.observe(section);
    });

    return () => observer.disconnect();
  }, []);

  const triggerSimulation = () => {
    setSimTrigger(prev => prev + 1);
  };

  const handlePhaseChange = (phase: string) => {
    setSimPhase(phase);
  };

  const handleJarvisInput = () => {
    setJarvisTrigger(prev => prev + 1);
  };

  return (
    <div className="h-screen w-screen overflow-y-auto snap-y snap-mandatory bg-black">
      {/* Navigation hint */}
      <div className="fixed top-4 left-4 z-50 font-mono text-green-400 text-xs">
        <div className="border border-green-800 bg-black/80 p-2">
          <p>{`// SERVICES BRIEFING`}</p>
          <p>SECTION {activeSection + 1}/6</p>
          <p className="text-gray-500">SCROLL TO NAVIGATE</p>
        </div>
      </div>

      {/* Back button */}
      <button
        onClick={() => router.push('/')}
        className="fixed top-4 right-4 z-50 font-mono text-green-400 text-xs border border-green-800 bg-black/80 px-3 py-2 hover:bg-green-900/30 transition-colors"
      >
        {`< RETURN`}
      </button>

      {/* SECTION 1: Quantum Firewall */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[0] = el; }}
        data-index="0"
        className="h-screen w-screen snap-start flex items-center justify-center relative"
      >
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <QuantumFirewallScene />
          </Canvas>
        </div>
        
        <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-l border-green-900 p-8 flex flex-col justify-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 font-mono">
            {`// QUANTUM FIREWALL ARCHITECTURE`}
          </h2>
          <p className="text-green-600 mb-6 font-mono text-sm">CHECK POINT INFINITY PLATFORM</p>
          
          <ul className="space-y-3 text-sm md:text-base font-mono text-green-400">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Check Point Quantum Series deployment
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Deep packet inspection at wire speed
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Automated threat prevention & isolation
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Integrated with Splunk SIEM for logging
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Zero-day protection via ThreatCloud AI
            </li>
          </ul>

          <button className="mt-8 px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors self-start">
            {`> EXPLORE CHECKPOINT STACK`}
          </button>
        </div>
      </section>

      {/* SECTION 2: Attack Simulation */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[1] = el; }}
        data-index="1"
        className="h-screen w-screen snap-start flex items-center justify-center relative"
      >
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <AttackSimulationScene 
              triggerSimulation={simTrigger} 
              onPhaseChange={handlePhaseChange}
            />
          </Canvas>
        </div>

        <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-l border-green-900 p-8 flex flex-col justify-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 font-mono">
            {`// LIVE ATTACK SIMULATION`}
          </h2>
          <p className="text-green-600 mb-6 font-mono text-sm">WATCH HOW I DEFEND YOUR INFRASTRUCTURE</p>
          
          <div className="mb-4 p-3 border border-green-900 bg-green-900/10 font-mono text-xs">
            <p className="text-green-400">STATUS: {simPhase || 'READY'}</p>
          </div>

          <ul className="space-y-3 text-sm md:text-base font-mono text-green-400">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Real-time threat detection & isolation
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Check Point + Splunk SOAR integration
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Automated playbook execution
            </li>
          <li className="flex items-start">
            <span className="text-green-600 mr-2">▸</span>
            Mean time to respond: {`< 60 seconds`}
          </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Zero manual intervention required
            </li>
          </ul>

          <div className="flex gap-4 mt-8">
            <button 
              onClick={triggerSimulation}
              className="px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors"
            >
              {`▶ RUN SIMULATION`}
            </button>
            <button className="px-6 py-3 border border-yellow-500 text-yellow-400 font-mono text-sm hover:bg-yellow-900/30 transition-colors">
              {`> REQUEST SECURITY AUDIT`}
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 3: AI Core */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[2] = el; }}
        data-index="2"
        className="h-screen w-screen snap-start flex items-center justify-center relative"
      >
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <AICoreScene jarvisInputTrigger={jarvisTrigger} />
          </Canvas>
        </div>

        <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-l border-green-900 p-8 flex flex-col justify-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 font-mono">
            {`// AI INTELLIGENCE CORE`}
          </h2>
          <p className="text-green-600 mb-6 font-mono text-sm">AUTONOMOUS THREAT RESPONSE SYSTEM</p>
          
          <ul className="space-y-3 text-sm md:text-base font-mono text-green-400">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              LLM-powered SOC assistant
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              RAG pipeline over security knowledge base
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Autonomous SOAR playbook triggering
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              ChatOps integration (Slack, Teams, WhatsApp)
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Continuous learning from threat feed
            </li>
          </ul>

          <button className="mt-8 px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors self-start">
            {`> DEPLOY AI AGENTS`}
          </button>
        </div>
      </section>

      {/* SECTION 4: Layered Fortress */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[3] = el; }}
        data-index="3"
        className="h-screen w-screen snap-start flex items-center justify-center relative"
      >
        <div className="absolute inset-0">
          <Canvas camera={{ position: [5, 0, 8], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <LayeredFortressScene />
          </Canvas>
        </div>

        <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-l border-green-900 p-8 flex flex-col justify-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 font-mono">
            {`// MOBILE & ON-PREM ARCHITECTURE`}
          </h2>
          <p className="text-green-600 mb-6 font-mono text-sm">HARMONY ENDPOINT · MOBILE SECURITY · EDGE DEFENCE</p>
          
          <ul className="space-y-3 text-sm md:text-base font-mono text-green-400">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Check Point Harmony for mobile & endpoint
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              On-premises Quantum appliance deployment
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Zero Trust access for every device
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              CloudGuard for cloud workload protection
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Splunk observability across all layers
            </li>
          </ul>

          <button className="mt-8 px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors self-start">
            {`> VIEW FULL STACK`}
          </button>
        </div>
      </section>

      {/* SECTION 5: Splunk Data Storm */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[4] = el; }}
        data-index="4"
        className="h-screen w-screen snap-start flex items-center justify-center relative"
      >
        <div className="absolute inset-0">
          <Canvas camera={{ position: [0, 5, 10], fov: 50 }}>
            <ambientLight intensity={0.5} />
            <pointLight position={[10, 10, 10]} intensity={1} />
            <OrbitControls enableDamping dampingFactor={0.05} />
            <SplunkDataStormScene />
          </Canvas>
        </div>

        <div className="absolute right-0 top-0 h-full w-full md:w-1/3 bg-black/90 border-l border-green-900 p-8 flex flex-col justify-center z-10">
          <h2 className="text-2xl md:text-3xl font-bold text-yellow-400 mb-2 font-mono">
            {`// SPLUNK OBSERVABILITY PLATFORM`}
          </h2>
          <p className="text-green-600 mb-6 font-mono text-sm">SIEM · SOAR · ITSI · REAL-TIME INTELLIGENCE</p>
          
          <ul className="space-y-3 text-sm md:text-base font-mono text-green-400">
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Splunk Cloud & Enterprise deployment
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Custom SIEM correlation rules
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              SOAR playbook automation
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              ITSI for service health monitoring
            </li>
            <li className="flex items-start">
              <span className="text-green-600 mr-2">▸</span>
              Executive dashboards & compliance reports
            </li>
          </ul>

          <button className="mt-8 px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors self-start">
            {`> VIEW SPLUNK CAPABILITIES`}
          </button>
        </div>
      </section>

      {/* SECTION 6: Hardware Showcase */}
      <section
        ref={(el: HTMLDivElement | null) => { if (el) sectionsRef.current[5] = el; }}
        data-index="5"
        className="h-screen w-screen snap-start relative"
      >
        <ModelShowcase />
      </section>

      {/* Tier Showcase Modal */}
      {showTierShowcase && selectedTier && (
        <TierShowcase
          tier={selectedTier.tier}
          title={selectedTier.title}
          description={selectedTier.description}
          models={selectedTier.models}
          onClose={() => {
            setShowTierShowcase(false);
            setSelectedTier(null);
          }}
        />
      )}

      {/* Fixed J.A.R.V.I.S. Panel */}
      <div className="fixed right-0 top-1/2 -translate-y-1/2 w-80 h-[60vh] z-40 hidden lg:block">
        <ChatbotArea status="online" currentTime={new Date().toLocaleTimeString()} />
      </div>

      {/* Demo CTA */}
      <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50">
        <button
          onClick={() => router.push('/demo')}
          className="px-8 py-4 border-2 border-yellow-500 text-yellow-400 font-mono text-lg hover:bg-yellow-900/30 transition-colors animate-pulse"
        >
          ▶ LAUNCH INTERACTIVE DEMO
        </button>
      </div>
    </div>
  );
}