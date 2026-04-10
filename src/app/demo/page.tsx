'use client';

import { useEffect, useRef, useState, useCallback, Suspense } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html, useCursor } from '@react-three/drei';
import * as THREE from 'three';
import { useRouter } from 'next/navigation';
import { sendEmail } from '../actions/send-email';

// ============================================================
// TYPES & CONSTANTS
// ============================================================

type ActIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** 3D stack triad: left / center / right — aligns with defense-in-depth story */
type StackLayerId = 'perimeter' | 'correlation' | 'visibility';

/** Y-rotation for check_point_router.glb so the branded/front face aims at the camera (try 0, Math.PI, or ±Math.PI/2 if the mesh updates). */
const CHECKPOINT_ROUTER_Y = 0;

const STACK_TRIAD: Record<
  StackLayerId,
  { position: [number, number, number]; rotation: [number, number, number]; scale: number; blurb: string }
> = {
  perimeter: {
    position: [-3.85, 0, 0],
    rotation: [0, CHECKPOINT_ROUTER_Y, 0],
    scale: 0.62,
    blurb: 'Perimeter: GeoIP, IPS, and zero-day prevention at the edge.',
  },
  correlation: {
    position: [0, 0, 0],
    rotation: [0, 0, 0],
    scale: 1.45,
    blurb: 'Ingest & correlation: logs and telemetry land in the data plane.',
  },
  visibility: {
    position: [3.85, 0, 0],
    rotation: [0, -0.35, 0],
    scale: 1.35,
    blurb: 'Operator view: Splunk dashboards, alerts, and automated playbooks.',
  },
};

const ACTS = [
  { id: 'cold_open', label: 'Calm Before' },
  { id: 'first_contact', label: 'Intrusion' },
  { id: 'the_wall', label: 'Firewall' },
  { id: 'kaspersky_shield', label: 'Endpoint Shield' },
  { id: 'inside_wire', label: 'Lateral Move' },
  { id: 'brain_wakes', label: 'AI Detection' },
  { id: 'intel_center', label: 'SIEM' },
  { id: 'after_action', label: 'Debrief' },
];

const COLORS = {
  cyan: '#00d4ff',
  red: '#ff3d6b',
  purple: '#7b5cfa',
  green: '#00e5a0',
  bg: '#0a0c10',
  surface: '#0f1117',
  card: '#141720',
};

// ============================================================
// LOADING SCREEN
// ============================================================

function LoadingScreen({ progress, loaded }: { progress: number; loaded: string[] }) {
  return (
    <div className="absolute inset-0 z-50 bg-black flex flex-col items-center justify-center">
      <div className="max-w-md w-full px-8">
        <h1 className="text-2xl md:text-4xl font-bold font-mono text-green-400 mb-2 text-center">
          BREACH SIMULATION
        </h1>
        <p className="text-xs font-mono text-gray-500 text-center mb-8">
          {'// LIVE THREAT ENVIRONMENT'}
        </p>

        <div className="space-y-4 mb-8">
          {['server_rack.glb', 'check_point_router.glb', 'splunk_mobile.glb'].map((name) => (
            <div key={name} className="flex items-center gap-4">
              <span className="text-xs font-mono text-gray-400 w-40 truncate">{name}</span>
              <div className="flex-1 h-1 bg-gray-800 rounded overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 ${loaded.includes(name) ? 'bg-green-500' : 'bg-gray-600'}`}
                  style={{ width: loaded.includes(name) ? '100%' : `${Math.random() * 30}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-gray-500 w-12 text-right">
                {loaded.includes(name) ? '✓' : '...'}
              </span>
            </div>
          ))}
        </div>

        <div className="h-1 bg-gray-800 rounded overflow-hidden">
          <div
            className="h-full bg-green-500 transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs font-mono text-gray-500 mt-2 text-center">
          Initializing threat environment... {Math.round(progress)}%
        </p>
      </div>
    </div>
  );
}

// ============================================================
// NETWORK ARC SYSTEM (Particles traveling between points)
// ============================================================

interface ArcParticle {
  position: THREE.Vector3;
  progress: number;
  speed: number;
  color: string;
  style: 'aggressive' | 'normal' | 'blocked';
}

function NetworkArcs({
  source,
  target,
  color,
  style = 'normal',
  count = 5,
  active = true,
}: {
  source: THREE.Vector3;
  target: THREE.Vector3;
  color: string;
  style?: 'aggressive' | 'normal' | 'blocked';
  count?: number;
  active?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const [particles] = useState(() =>
    Array.from({ length: count }, (_, i) => ({
      position: source.clone(),
      progress: i / count,
      speed: style === 'aggressive' ? 1.5 + Math.random() * 0.5 : 0.3 + Math.random() * 0.2,
      color,
      style,
    }))
  );

  useFrame((state, delta) => {
    if (!active || !groupRef.current) return;

    const direction = target.clone().sub(source).normalize();
    const distance = source.distanceTo(target);

    particles.forEach((p) => {
      p.progress += (p.speed * delta) / distance;

      if (p.style === 'blocked' && p.progress > 0.5) {
        // Shatter at midpoint
        p.progress = 0;
        p.position.copy(source);
        return;
      }

      if (p.progress >= 1) {
        if (p.style === 'normal') {
          p.progress = 0;
          p.position.copy(source);
        } else {
          p.progress = 1;
          p.position.copy(target);
        }
        return;
      }

      p.position.copy(source).add(direction.clone().multiplyScalar(distance * p.progress));

      // Add slight curve
      const curveOffset = Math.sin(p.progress * Math.PI) * 0.5;
      p.position.y += curveOffset;
    });
  });

  if (!active) return null;

  const positions = new Float32Array([...source.toArray(), ...target.toArray()]);

  return (
    <group ref={groupRef}>
      {/* Arc line using lineSegments */}
      <lineSegments>
        <bufferGeometry attach="geometry">
          <bufferAttribute
            attach="attributes-position"
            args={[positions, 3]}
            count={2}
            itemSize={3}
          />
        </bufferGeometry>
        <lineBasicMaterial color={color} transparent opacity={0.3} attach="material" />
      </lineSegments>

      {/* Traveling particles */}
      {particles.map((p, i) => (
        <mesh key={i} position={p.position}>
          <sphereGeometry args={[style === 'aggressive' ? 0.08 : 0.04, 4, 4]} />
          <meshBasicMaterial color={p.color} transparent opacity={style === 'aggressive' ? 0.9 : 0.6} attach="material" />
        </mesh>
      ))}
    </group>
  );
}

// ============================================================
// MODEL COMPONENTS
// ============================================================

function ServerRack({
  position = [0, 0, 0],
  scale = 1,
  visible = true,
  accentColor = COLORS.cyan,
  spin = true,
}: {
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
  accentColor?: string;
  spin?: boolean;
}) {
  const { scene } = useGLTF('/models/server_rack.glb');
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current && spin) {
      groupRef.current.rotation.y += delta * 0.1;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position as THREE.Vector3Tuple} scale={[scale, scale, scale]}>
      <primitive object={scene} />
      <pointLight position={[0, 2, 2]} intensity={1.5} distance={5} color={accentColor} />
    </group>
  );
}

function CheckPointRouter({
  position = [0, 0, 0],
  scale = 1,
  visible = false,
  rotation = [0, 0, 0],
  accentColor = COLORS.green,
  spin = true,
}: {
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
  rotation?: [number, number, number];
  accentColor?: string;
  spin?: boolean;
}) {
  const { scene } = useGLTF('/models/check_point_router.glb');
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current && spin) {
      groupRef.current.rotation.y += delta * 0.05;
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position as THREE.Vector3Tuple} rotation={rotation as THREE.EulerTuple} scale={[scale, scale, scale]}>
      <primitive object={scene} />
      <pointLight position={[0, 2, 2]} intensity={1.5} distance={5} color={accentColor} />
    </group>
  );
}

function SplunkMobile({
  position = [0, 0, 0],
  scale = 1,
  visible = false,
  bob = false,
  accentColor = COLORS.purple,
  spin = true,
}: {
  position?: [number, number, number];
  scale?: number;
  visible?: boolean;
  bob?: boolean;
  accentColor?: string;
  spin?: boolean;
}) {
  const { scene } = useGLTF('/models/splunk_mobile.glb');
  const groupRef = useRef<THREE.Group>(null);

  useFrame((state, delta) => {
    if (groupRef.current) {
      const baseY = position[1];
      groupRef.current.position.y = bob ? baseY + Math.sin(state.clock.elapsedTime * 0.8) * 0.15 : baseY;
      if (spin) {
        groupRef.current.rotation.y += delta * 0.05;
      }
    }
  });

  if (!visible) return null;

  return (
    <group ref={groupRef} position={position as THREE.Vector3Tuple} scale={[scale, scale, scale]}>
      <primitive object={scene} />
      <pointLight position={[0, 2, 2]} intensity={1.5} distance={5} color={accentColor} />
    </group>
  );
}

// Preload models
useGLTF.preload('/models/server_rack.glb');
useGLTF.preload('/models/check_point_router.glb');
useGLTF.preload('/models/splunk_mobile.glb');

// ============================================================
// STACK TRIAD — Acts 6 & 7 (1/3 · 2/3 · 3/3 layout, clickable)
// ============================================================

function StackTriadModels({
  stackFocus,
  onFocus,
}: {
  stackFocus: StackLayerId | null;
  onFocus: (id: StackLayerId) => void;
}) {
  const [hovered, setHovered] = useState<StackLayerId | null>(null);
  useCursor(!!hovered);

  const scaleFor = (id: StackLayerId) => {
    const s = STACK_TRIAD[id].scale;
    return stackFocus === id ? s * 1.14 : s;
  };

  return (
    <>
      <group
        position={STACK_TRIAD.perimeter.position as THREE.Vector3Tuple}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('perimeter');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onFocus('perimeter');
        }}
      >
        <CheckPointRouter
          position={[0, 0, 0]}
          scale={scaleFor('perimeter')}
          visible
          rotation={STACK_TRIAD.perimeter.rotation}
          accentColor={stackFocus === 'perimeter' ? COLORS.green : COLORS.cyan}
          spin={false}
        />
      </group>

      <group
        position={STACK_TRIAD.correlation.position as THREE.Vector3Tuple}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('correlation');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onFocus('correlation');
        }}
      >
        <ServerRack
          position={[0, 0, 0]}
          scale={scaleFor('correlation')}
          visible
          accentColor={stackFocus === 'correlation' ? COLORS.cyan : '#4a9eff'}
          spin={false}
        />
      </group>

      <group
        position={STACK_TRIAD.visibility.position as THREE.Vector3Tuple}
        rotation={STACK_TRIAD.visibility.rotation as THREE.EulerTuple}
        onPointerOver={(e) => {
          e.stopPropagation();
          setHovered('visibility');
        }}
        onPointerOut={(e) => {
          e.stopPropagation();
          setHovered(null);
        }}
        onClick={(e) => {
          e.stopPropagation();
          onFocus('visibility');
        }}
      >
        <SplunkMobile
          position={[0, 0, 0]}
          scale={scaleFor('visibility')}
          visible
          bob={false}
          accentColor={stackFocus === 'visibility' ? COLORS.purple : '#a78bfa'}
          spin={false}
        />
      </group>
    </>
  );
}

// ============================================================
// KASPERSKY ENDPOINT SHIELD (Act 3 - Virus catching visualization)
// ============================================================

function KasperskyShield({ active = false }: { active?: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  const ringRef = useRef<THREE.Mesh>(null);
  const [viruses, setViruses] = useState<{ pos: THREE.Vector3; speed: number; caught: boolean; explosion: number }[]>([]);

  // Initialize viruses
  useEffect(() => {
    if (active) {
      const initialViruses = Array.from({ length: 8 }, (_, i) => ({
        pos: new THREE.Vector3(-5 + Math.random() * 2, -2 + Math.random() * 4, Math.random() * 2 - 1),
        speed: 0.5 + Math.random() * 0.5,
        caught: false,
        explosion: 0,
      }));
      setViruses(initialViruses);
    }
  }, [active]);

  useFrame((state, delta) => {
    if (!active || !groupRef.current) return;

    // Rotate the shield ring
    if (ringRef.current) {
      ringRef.current.rotation.z = state.clock.elapsedTime * 0.5;
    }

    setViruses(prev => prev.map(v => {
      if (v.explosion > 0) {
        return { ...v, explosion: v.explosion - delta * 2 };
      }

      if (v.caught) return v;

      // Move virus toward center (where the shield is)
      const direction = new THREE.Vector3(0, 0, 0).clone().sub(v.pos).normalize();
      const newPos = v.pos.clone().add(direction.multiplyScalar(v.speed * delta));

      // Check if virus reached the shield (center area)
      if (newPos.distanceTo(new THREE.Vector3(0, 0, 0)) < 1.5) {
        // Virus caught!
        return { ...v, caught: true, explosion: 1 };
      }

      return { ...v, pos: newPos };
    }));
  });

  if (!active) return null;

  return (
    <group ref={groupRef}>
      {/* Kaspersky Shield Dome */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.5, 16, 16]} />
        <meshBasicMaterial color="#0066ff" transparent opacity={0.15} wireframe />
      </mesh>
      
      {/* Inner shield glow */}
      <mesh position={[0, 0, 0]}>
        <sphereGeometry args={[1.3, 16, 16]} />
        <meshBasicMaterial color="#0088ff" transparent opacity={0.1} />
      </mesh>

      {/* Rotating shield ring */}
      <mesh ref={ringRef} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[1.6, 0.03, 8, 32]} />
        <meshBasicMaterial color="#0066ff" transparent opacity={0.6} />
      </mesh>

      {/* Kaspersky label */}
      <Html position={[0, 2.5, 0]}>
        <div className="text-center">
          <div className="text-xs font-mono text-blue-400 bg-black/80 px-3 py-1 border border-blue-500/50 whitespace-nowrap">
            KASPERSKY ENDPOINT SECURITY
          </div>
        </div>
      </Html>

      {/* Viruses */}
      {viruses.map((virus, i) => (
        <group key={i} position={virus.pos}>
          {virus.explosion > 0 ? (
            // Explosion effect
            <mesh>
              <sphereGeometry args={[0.15 * virus.explosion, 8, 8]} />
              <meshBasicMaterial color="#ff3d6b" transparent opacity={virus.explosion} />
            </mesh>
          ) : virus.caught ? null : (
            // Virus particle
            <mesh>
              <icosahedronGeometry args={[0.08, 1]} />
              <meshBasicMaterial color="#ff3d6b" />
            </mesh>
          )}
        </group>
      ))}

      {/* Status indicator */}
      <Html position={[2.5, -1, 0]}>
        <div className="text-xs font-mono text-green-400 bg-black/80 px-2 py-1 border border-green-500/30">
          THREATS NEUTRALIZED: {viruses.filter(v => v.caught).length}/{viruses.length}
        </div>
      </Html>
    </group>
  );
}

// ============================================================
// NODE GRAPH (For Acts 4 & 5)
// ============================================================

function NodeGraph({
  compromised = false,
  aiActive = false,
  spread = 1,
  groupOffset = [0, 0, 0],
  wireframeRadius = 4,
  wireframeCenter = [0, 2, 0],
  rotateGraph = true,
}: {
  compromised?: boolean;
  aiActive?: boolean;
  spread?: number;
  groupOffset?: [number, number, number];
  wireframeRadius?: number;
  wireframeCenter?: [number, number, number];
  rotateGraph?: boolean;
}) {
  const groupRef = useRef<THREE.Group>(null);

  const baseNodes = [
    { id: 'wkstn-01', pos: [-3, 0, 0], compromised: false },
    { id: 'wkstn-02', pos: [-1.5, 1.5, 0], compromised: false },
    { id: 'wkstn-07', pos: [1.5, 1.5, 0], compromised: true },
    { id: 'wkstn-04', pos: [3, 0, 0], compromised: false },
    { id: 'wkstn-05', pos: [-1.5, -1.5, 0], compromised: false },
    { id: 'wkstn-06', pos: [1.5, -1.5, 0], compromised: false },
    { id: 'dc-01', pos: [0, 0, 0], compromised: false, isServer: true },
  ];

  const nodes = baseNodes.map((n) => ({
    ...n,
    pos: [n.pos[0] * spread, n.pos[1] * spread, n.pos[2] * spread] as [number, number, number],
  }));

  useFrame((state, delta) => {
    if (groupRef.current && rotateGraph) {
      groupRef.current.rotation.y += delta * 0.02;
    }
  });

  return (
    <group ref={groupRef} position={groupOffset as THREE.Vector3Tuple}>
      {nodes.map((node, i) => (
        <group key={node.id} position={node.pos as THREE.Vector3Tuple}>
          {/* Node sphere */}
          <mesh>
            <sphereGeometry args={[node.isServer ? 0.3 : 0.2, 8, 8]} />
            <meshBasicMaterial
              color={node.compromised && compromised ? COLORS.red : aiActive ? COLORS.purple : COLORS.cyan}
              transparent
              opacity={0.8}
            />
          </mesh>
          {node.isServer && (
            <mesh>
              <sphereGeometry args={[0.4, 8, 8]} />
              <meshBasicMaterial color={node.compromised && compromised ? COLORS.red : COLORS.cyan} wireframe transparent opacity={0.3} />
            </mesh>
          )}
          {/* Compromised pulse */}
          {node.compromised && compromised && (
            <mesh>
              <sphereGeometry args={[0.3 + Math.sin(Date.now() * 0.005) * 0.1, 8, 8]} />
              <meshBasicMaterial color={COLORS.red} transparent opacity={0.3 + Math.sin(Date.now() * 0.005) * 0.2} />
            </mesh>
          )}
          {/* AI lockdown ring */}
          {node.compromised && aiActive && (
            <mesh rotation={[Math.PI / 2, 0, 0]}>
              <torusGeometry args={[0.35, 0.02, 8, 16]} />
              <meshBasicMaterial color={COLORS.purple} />
            </mesh>
          )}
        </group>
      ))}

      {/* Connection lines */}
      {nodes.map((n1, i) =>
        nodes.slice(i + 1).map((n2, j) => {
          const isCompromisedConnection = n1.compromised && compromised;
          const linePos = new Float32Array([...n1.pos, ...n2.pos]);
          return (
            <lineSegments key={`${i}-${j}`}>
              <bufferGeometry attach="geometry">
                <bufferAttribute
                  attach="attributes-position"
                  args={[linePos, 3]}
                  count={2}
                  itemSize={3}
                />
              </bufferGeometry>
              <lineBasicMaterial
                color={isCompromisedConnection ? COLORS.red : aiActive ? COLORS.purple : COLORS.cyan}
                transparent
                opacity={isCompromisedConnection ? 0.6 : 0.2}
                attach="material"
              />
            </lineSegments>
          );
        })
      )}

      {/* AI Neural mesh overlay — kept behind / around the phone, not through it */}
      {aiActive && (
        <mesh position={wireframeCenter as THREE.Vector3Tuple}>
          <sphereGeometry args={[wireframeRadius, 8, 8]} />
          <meshBasicMaterial color={COLORS.purple} wireframe transparent opacity={0.1} />
        </mesh>
      )}
    </group>
  );
}

// ============================================================
// MAIN DEMO SCENE
// ============================================================

function DemoScene({
  act,
  loaded,
  onLoaded,
  stackFocus,
  onStackFocus,
}: {
  act: ActIndex;
  loaded: boolean;
  onLoaded: () => void;
  stackFocus: StackLayerId | null;
  onStackFocus: (id: StackLayerId) => void;
}) {
  const { camera } = useThree();

  // Camera positions per act - wider FOV on triad acts so1/3 · 2/3 · 3/3 reads clearly
  const cameraPositions = [
    new THREE.Vector3(0, 2, 8),    // Act 0: Cold open
    new THREE.Vector3(0, 2, 8),    // Act 1: First contact
    new THREE.Vector3(0, 2, 8),    // Act 2: The wall
    new THREE.Vector3(0, 3, 8),    // Act 3: Kaspersky Shield
    new THREE.Vector3(0, 5, 8),    // Act 4: Inside wire
    new THREE.Vector3(0, 4.2, 8.5), // Act 5: Brain wakes — phone forward, graph recedes
    new THREE.Vector3(0, 2.65, 10.2), // Act 6: SIEM triad
    new THREE.Vector3(0, 2.55, 10.8), // Act 7: Full stack + debrief
  ];

  useFrame((state, delta) => {
    camera.position.lerp(cameraPositions[act], delta * 0.5);
    camera.lookAt(0, 0, 0);
  });

  // Track model loading - simple timeout approach
  useEffect(() => {
    if (!loaded) {
      const timer = setTimeout(() => {
        onLoaded();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [loaded, onLoaded]);

  if (!loaded) {
    return null;
  }

  return (
    <>
      {/* Main lighting setup */}
      <ambientLight intensity={0.8} />
      <pointLight position={[5, 5, 5]} intensity={2.0} color={COLORS.cyan} />
      <pointLight position={[-3, 3, -3]} intensity={1.2} color="#ffffff" />
      <directionalLight position={[0, 5, 5]} intensity={0.8} />

      {/* Grid floor for acts 0-4, 6 */}
      {act !== 3 && act !== 4 && (
        <mesh position={[0, -3, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[50, 50]} />
          <meshBasicMaterial color="#1a1a2e" wireframe transparent opacity={0.15} />
        </mesh>
      )}

      <OrbitControls
        enableDamping
        dampingFactor={0.05}
        enableZoom={act === 6 || act === 7}
        enablePan={false}
        minDistance={5}
        maxDistance={22}
      />

      {/* ACT 0-1: Server Rack (centered, large) */}
      {(act <= 1) && (
        <ServerRack
          position={[0, 0, 0]}
          scale={2}
          visible={true}
          accentColor={COLORS.cyan}
        />
      )}

      {/* ACT 2: Server Rack (centered) + Check Point Router */}
      {act === 2 && (
        <>
          <ServerRack
            position={[0, 0, 0]}
            scale={2}
            visible={true}
            accentColor={COLORS.cyan}
          />
          <CheckPointRouter
            position={[-2.85, 0, 0]}
            scale={0.82}
            visible={true}
            rotation={[0, CHECKPOINT_ROUTER_Y, 0]}
            accentColor={COLORS.red}
            spin={false}
          />
        </>
      )}

      {/* ACT 6: Defense triad — left / center / right, clickable */}
      {act === 6 && (
        <>
          <StackTriadModels stackFocus={stackFocus} onFocus={onStackFocus} />
          <NetworkArcs
            source={new THREE.Vector3(STACK_TRIAD.perimeter.position[0], 0.15, 0)}
            target={new THREE.Vector3(STACK_TRIAD.correlation.position[0], 0, 0)}
            color={COLORS.cyan}
            style="normal"
            count={5}
            active
          />
          <NetworkArcs
            source={new THREE.Vector3(STACK_TRIAD.correlation.position[0], 0, 0)}
            target={new THREE.Vector3(STACK_TRIAD.visibility.position[0], 0.12, 0)}
            color={COLORS.purple}
            style="normal"
            count={5}
            active
          />
        </>
      )}

      {/* ACT 7: Same live stack — “everything together” in the 3D view */}
      {act === 7 && (
        <>
          <StackTriadModels stackFocus={stackFocus} onFocus={onStackFocus} />
          <NetworkArcs
            source={new THREE.Vector3(STACK_TRIAD.perimeter.position[0], 0.15, 0)}
            target={new THREE.Vector3(STACK_TRIAD.correlation.position[0], 0, 0)}
            color={COLORS.green}
            style="normal"
            count={4}
            active
          />
          <NetworkArcs
            source={new THREE.Vector3(STACK_TRIAD.correlation.position[0], 0, 0)}
            target={new THREE.Vector3(STACK_TRIAD.visibility.position[0], 0.12, 0)}
            color={COLORS.cyan}
            style="normal"
            count={4}
            active
          />
        </>
      )}

      {/* ACT 5: Splunk Mobile — in front of the correlation mesh so nodes don’t clip the handset */}
      {act === 5 && (
        <SplunkMobile
          position={[0, 0.12, 2.35]}
          scale={2.35}
          visible={true}
          bob={true}
          accentColor={COLORS.purple}
          spin={false}
        />
      )}

      {/* ACT 1: Attack arcs */}
      {act === 1 && (
        <NetworkArcs
          source={new THREE.Vector3(-5, 0, 0)}
          target={new THREE.Vector3(0, 0, 0)}
          color={COLORS.red}
          style="aggressive"
          count={8}
          active={true}
        />
      )}

      {/* ACT 2: Blocked arcs */}
      {act === 2 && (
        <>
          <NetworkArcs
            source={new THREE.Vector3(-5, 0, 0)}
            target={new THREE.Vector3(-3, 0, 0)}
            color={COLORS.red}
            style="blocked"
            count={6}
            active={true}
          />
          <NetworkArcs
            source={new THREE.Vector3(-3, 0, 0)}
            target={new THREE.Vector3(0, 0, 0)}
            color={COLORS.green}
            style="normal"
            count={3}
            active={true}
          />
        </>
      )}

      {/* ACT 3: Kaspersky Shield */}
      {act === 3 && (
        <KasperskyShield active={true} />
      )}

      {/* ACT 4-5: Node Graph */}
      {act === 4 && <NodeGraph compromised={true} aiActive={false} />}
      {act === 5 && (
        <NodeGraph
          compromised={true}
          aiActive={true}
          spread={1.32}
          groupOffset={[0, 0, -2.1]}
          wireframeRadius={3.1}
          wireframeCenter={[0, 0.8, -3.4]}
          rotateGraph={false}
        />
      )}

      {/* ACT 5: Data arcs to Splunk */}
      {act === 5 && (
        <>
          <NetworkArcs
            source={new THREE.Vector3(-4, 0, -0.5)}
            target={new THREE.Vector3(0, 0.12, 2.35)}
            color={COLORS.cyan}
            style="normal"
            count={10}
            active={true}
          />
          <NetworkArcs
            source={new THREE.Vector3(4, 0, -0.5)}
            target={new THREE.Vector3(0, 0.12, 2.35)}
            color={COLORS.cyan}
            style="normal"
            count={10}
            active={true}
          />
        </>
      )}

    </>
  );
}

// ============================================================
// OVERLAY COMPONENTS
// ============================================================

function TypewriterText({ text, delay = 0, speed = 30 }: { text: string; delay?: number; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setStarted(true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let index = 0;
    const interval = setInterval(() => {
      if (index < text.length) {
        setDisplayed(text.slice(0, index + 1));
        index++;
      } else {
        clearInterval(interval);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, started, speed]);

  return <span>{displayed}</span>;
}

function ActOverlay({ act }: { act: ActIndex }) {
  if (act === 7) return null;

  const overlays = [
    // Act 0: Cold Open
    <div key="0" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-gray-500 mb-2">04:47 AM</p>
      <h2 className="text-xl font-bold font-mono text-green-400 mb-4">
        <TypewriterText text="All systems nominal." delay={500} />
      </h2>
      <div className="space-y-2 text-xs font-mono text-gray-400">
        <p>Network load: 2.3 Gbps</p>
        <p>Threat index: <span className="text-green-400">LOW</span></p>
      </div>
    </div>,

    // Act 1: First Contact
    <div key="1" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-red-400 mb-2 animate-pulse">04:51 AM — ALERT</p>
      <h2 className="text-xl font-bold font-mono text-red-400 mb-4">
        <TypewriterText text="Anomalous traffic detected" delay={300} />
      </h2>
      <div className="space-y-2 text-xs font-mono text-gray-400">
        <p>Source: <span className="text-red-400">185.220.xx.xx (Tor exit node)</span></p>
        <p>Pattern: Port scanning — 3,200 probes/sec</p>
      </div>
      <p className="text-[10px] font-mono text-gray-600 mt-4 italic">
        Without perimeter defense, this goes unnoticed.
      </p>
    </div>,

    // Act 2: The Wall
    <div key="2" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-green-400 mb-2">04:51:03 AM</p>
      <h2 className="text-xl font-bold font-mono text-green-400 mb-4">
        <TypewriterText text="Check Point Quantum Firewall — ACTIVE" delay={300} />
      </h2>
      <div className="space-y-2 text-xs font-mono text-gray-400">
        <p>Intrusion attempt <span className="text-green-400">BLOCKED</span></p>
        <p>Rule: GeoIP block + IPS signature #CVE-2024-3400</p>
      </div>

      <div className="mt-6 p-4 bg-[#0d0f14] border border-[#ff3d6b]/50 rounded-lg shadow-[0_0_20px_rgba(255,61,107,0.12)]">
        <p className="text-sm font-mono text-green-400 font-bold mb-2 tracking-wide">THREAT PREVENTED</p>
        <div className="space-y-1.5 text-xs font-mono text-gray-200">
          <p><span className="text-gray-500">Type:</span> Exploit attempt</p>
          <p><span className="text-gray-500">CVE:</span> <span className="text-orange-300">CVE-2024-3400</span></p>
          <p><span className="text-gray-500">Action:</span> <span className="text-green-400">DROP + LOG</span></p>
          <p><span className="text-gray-500">Response time:</span> 0.003s</p>
        </div>
      </div>
    </div>,

    // Act 3: Kaspersky Shield
    <div key="3" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-blue-400 mb-2 animate-pulse">04:52 AM — KASPERSKY ACTIVE</p>
      <h2 className="text-xl font-bold font-mono text-blue-400 mb-4">
        <TypewriterText text="Endpoint protection engaged" delay={300} />
      </h2>
      <div className="space-y-2 text-xs font-mono text-gray-400">
        <p>Threat: <span className="text-red-400">Malware payload detected</span></p>
        <p>Location: <span className="text-blue-400">Endpoint security layer</span></p>
        <p>Action: <span className="text-green-400">Quarantine + Neutralization</span></p>
      </div>

      <div className="mt-4 p-4 bg-[#141720] border border-[#0066ff]/30 rounded-lg">
        <p className="text-xs font-mono text-blue-400 font-bold mb-2">VIRUS CATCHING</p>
        <div className="space-y-1 text-[10px] font-mono text-gray-400">
          <p>Malware signatures: <span className="text-green-400">DETECTED</span></p>
          <p>Behavioral analysis: <span className="text-green-400">ANOMALOUS</span></p>
          <p>Quarantine status: <span className="text-green-400">ACTIVE</span></p>
          <p>System impact: <span className="text-green-400">MINIMAL</span></p>
        </div>
      </div>

      <p className="text-[10px] font-mono text-gray-600 mt-4 italic">
        Endpoint security prevents malware execution before it can spread.
      </p>
    </div>,

    // Act 4: Brain Wakes Up
    <div key="4" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-purple-400 mb-2 animate-pulse">AI ANOMALY ENGINE — ALERT</p>
      <h2 className="text-xl font-bold font-mono text-purple-400 mb-4">
        <TypewriterText text="Behavioral deviation: 94.7/100" delay={300} />
      </h2>
      <div className="space-y-2 text-xs font-mono text-gray-400">
        <p>Action: <span className="text-purple-400">Isolating WKSTN-07</span></p>
        <p>Playbook: SOAR-AUTO-007 triggered</p>
      </div>

      <div className="mt-6 p-3 bg-[#141720] border border-[#7b5cfa]/30 rounded-lg font-mono text-[10px]">
        <div className="text-purple-400 mb-2">LIVE FEED:</div>
        <div className="space-y-1 text-gray-400">
          <TypewriterText text="[04:58:11] Scanning WKSTN-07 processes..." delay={500} speed={20} />
          <TypewriterText text="[04:58:12] Malicious DLL detected: svchost32.exe" delay={2000} speed={20} />
          <TypewriterText text="[04:58:12] Killing process tree..." delay={4000} speed={20} />
          <TypewriterText text="[04:58:13] Quarantine complete." delay={5500} speed={20} />
          <TypewriterText text="[04:58:13] Ticket #INC-20491 opened." delay={7000} speed={20} />
        </div>
      </div>
    </div>,

    // Act 5: Intelligence Center
    <div key="5" className="absolute top-8 left-8 z-20 max-w-md">
      <p className="text-xs font-mono text-cyan-400 mb-2">CORRELATION ENGINE</p>
      <h2 className="text-xl font-bold font-mono text-cyan-400 mb-4">
        <TypewriterText text="Splunk SIEM — All data absorbed" delay={300} />
      </h2>

      <div className="mt-4 p-4 bg-[#141720] border border-[#00d4ff]/30 rounded-lg">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-[10px] font-mono text-gray-500">EVENTS INGESTED</p>
            <p className="text-2xl font-bold font-mono text-cyan-400">48,231</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500">ALERTS FIRED</p>
            <p className="text-2xl font-bold font-mono text-yellow-400">3</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500">AUTO-RESOLVED</p>
            <p className="text-2xl font-bold font-mono text-green-400">2</p>
          </div>
          <div>
            <p className="text-[10px] font-mono text-gray-500">ESCALATED</p>
            <p className="text-2xl font-bold font-mono text-red-400">1</p>
          </div>
        </div>
      </div>

      <p className="text-[10px] font-mono text-gray-600 mt-4 italic">
        Every packet. Every process. Every login. Recorded.
      </p>
    </div>,

    // Act 6: After Action
    <div key="6" className="absolute top-8 left-8 z-20 max-w-lg">
      <p className="text-xs font-mono text-green-400 mb-2">INCIDENT CLOSED</p>
      <h2 className="text-xl font-bold font-mono text-green-400 mb-4">
        <TypewriterText text="All systems secure." delay={300} />
      </h2>

      <div className="p-4 bg-[#0d0f14] border border-[#00e5a0]/45 rounded-lg shadow-[0_0_16px_rgba(0,229,160,0.08)]">
        <p className="text-sm font-mono text-green-400 font-bold mb-3">INCIDENT SUMMARY</p>
        <div className="space-y-2 text-sm font-mono text-gray-200">
          <div className="flex justify-between">
            <span>Attack type:</span>
            <span>Exploit + Lateral Move</span>
          </div>
          <div className="flex justify-between">
            <span>Duration:</span>
            <span>11 minutes 22 seconds</span>
          </div>
          <div className="flex justify-between">
            <span>Endpoints hit:</span>
            <span className="text-green-400">1 (contained)</span>
          </div>
          <div className="flex justify-between">
            <span>Data exfil:</span>
            <span className="text-green-400">0 bytes</span>
          </div>
          <div className="flex justify-between">
            <span>Auto-resolved:</span>
            <span className="text-green-400">Yes</span>
          </div>
          <div className="border-t border-gray-600 my-2 pt-2">
            <p className="text-xs text-gray-400 mb-1">Stack used:</p>
            <p className="text-green-400 text-sm">✓ Check Point Quantum</p>
            <p className="text-green-400 text-sm">✓ Kaspersky Endpoint Security</p>
            <p className="text-green-400 text-sm">✓ AI Anomaly Detection Engine</p>
            <p className="text-green-400 text-sm">✓ Splunk SIEM + SOAR</p>
          </div>
        </div>
      </div>
      <p className="text-xs font-mono text-gray-300 mt-3 max-w-sm leading-snug">
        Tip: click each 3D asset left-to-right (edge firewall, data plane rack, Splunk console) to highlight that layer.
      </p>
    </div>,

  ];

  return <>{overlays[act]}</>;
}

// ============================================================
// ACT 8 (index 7): Full debrief + live triad + lead capture
// ============================================================

function ActSevenPanel({
  stackFocus,
  onStackFocus,
}: {
  stackFocus: StackLayerId | null;
  onStackFocus: (id: StackLayerId | null) => void;
}) {
  const [leadStatus, setLeadStatus] = useState<'idle' | 'ok' | 'err'>('idle');
  const [sending, setSending] = useState(false);

  const focusLabel: Record<StackLayerId, string> = {
    perimeter: 'Perimeter / Check Point',
    correlation: 'Ingest & correlation (data plane)',
    visibility: 'Splunk visibility & SOAR',
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    setLeadStatus('idle');
    const form = e.currentTarget;
    const fd = new FormData(form);
    const rawMsg = (fd.get('message') as string) || '';
    const interest = (fd.get('interest') as string) || 'Not specified';
    const focusLine = stackFocus ? `3D focus: ${focusLabel[stackFocus]}` : '3D focus: (none)';
    fd.set('message', `[DEMO_LEAD]\nInterest: ${interest}\n${focusLine}\n\n${rawMsg}`);
    const result = await sendEmail(fd);
    setSending(false);
    if (result.success) {
      setLeadStatus('ok');
      form.reset();
    } else {
      setLeadStatus('err');
    }
  };

  const cardClass = (id: StackLayerId) =>
    `p-3 rounded-lg border text-left transition-all cursor-pointer ${
      stackFocus === id
        ? 'bg-[#1a2030] border-green-400/70 shadow-[0_0_12px_rgba(0,229,160,0.25)]'
        : 'bg-[#141720] border-[#1e2330] hover:border-cyan-500/40'
    }`;

  return (
    <div className="pointer-events-none absolute inset-0 z-20 flex flex-col md:flex-row md:items-start md:justify-between gap-4 px-4 md:px-8 pt-20 pb-36">
      <div className="pointer-events-auto w-full max-w-lg space-y-4">
        <p className="text-xs font-mono text-cyan-400 tracking-widest font-semibold">SECURITY STACK OVERVIEW</p>
        <h2 className="text-lg md:text-xl font-bold font-mono text-white">
          <TypewriterText text="Complete defense in depth — live stack" delay={200} />
        </h2>
        <p className="text-xs font-mono text-gray-300 leading-relaxed">
          Click a layer in the scene or a card below. Left-to-right: edge → data plane → operator console.
        </p>

        <div className="grid grid-cols-2 gap-3">
          <button type="button" className={cardClass('perimeter')} onClick={() => onStackFocus('perimeter')}>
            <p className="text-xs font-mono text-cyan-400 font-bold mb-1">PERIMETER</p>
            <p className="text-[11px] font-mono text-gray-200 text-left leading-snug">Check Point · GeoIP · IPS · zero-day</p>
          </button>
          <button type="button" className={cardClass('correlation')} onClick={() => onStackFocus('correlation')}>
            <p className="text-xs font-mono text-blue-400 font-bold mb-1">ENDPOINT + AI</p>
            <p className="text-[11px] font-mono text-gray-200 text-left leading-snug">Kaspersky · baselines · automated response</p>
          </button>
          <button type="button" className={cardClass('correlation')} onClick={() => onStackFocus('correlation')}>
            <p className="text-xs font-mono text-purple-400 font-bold mb-1">DATA PLANE</p>
            <p className="text-[11px] font-mono text-gray-200 text-left leading-snug">Ingest · correlation · telemetry</p>
          </button>
          <button type="button" className={cardClass('visibility')} onClick={() => onStackFocus('visibility')}>
            <p className="text-xs font-mono text-orange-400 font-bold mb-1">SIEM / SOAR</p>
            <p className="text-[11px] font-mono text-gray-200 text-left leading-snug">Splunk · playbooks · dashboards</p>
          </button>
        </div>

        {stackFocus && (
          <div className="p-3 rounded-lg border border-green-500/40 bg-black/90 font-mono text-xs text-green-200 leading-relaxed">
            {STACK_TRIAD[stackFocus].blurb}
          </div>
        )}
      </div>

      <div className="pointer-events-auto w-full max-w-md border border-orange-400/60 bg-[#07080c]/95 p-5 rounded-lg shadow-[0_0_32px_rgba(255,102,0,0.18)] backdrop-blur-sm">
        <p className="text-xs font-mono text-orange-400 mb-1 tracking-widest font-bold">SECURE_INTAKE_CHANNEL</p>
        <h3 className="text-base font-mono text-white font-bold mb-4">Tell us what you want to solve</h3>
        <form onSubmit={handleSubmit} className="space-y-4 font-mono text-xs">
          <div>
            <label className="block text-orange-200/90 mb-1.5 text-[11px] font-semibold" htmlFor="demo-name">
              {'// NAME_OR_ORG'}
            </label>
            <input
              id="demo-name"
              name="name"
              required
              className="w-full bg-black border border-orange-700/70 text-orange-50 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-sm placeholder:text-orange-900/80"
              placeholder="Acme Security / Jane Doe"
            />
          </div>
          <div>
            <label className="block text-orange-200/90 mb-1.5 text-[11px] font-semibold" htmlFor="demo-email">
              {'// EMAIL'}
            </label>
            <input
              id="demo-email"
              name="email"
              type="email"
              required
              className="w-full bg-black border border-orange-700/70 text-orange-50 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-sm placeholder:text-orange-900/80"
              placeholder="you@organization.com"
            />
          </div>
          <div>
            <label className="block text-orange-200/90 mb-1.5 text-[11px] font-semibold" htmlFor="demo-interest">
              PRIMARY INTEREST
            </label>
            <select
              id="demo-interest"
              name="interest"
              className="demo-intake-select w-full bg-black border border-orange-700/70 text-orange-50 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-sm"
              defaultValue="Full stack assessment"
            >
              <option className="bg-neutral-950 text-orange-100">Perimeter / firewall modernization</option>
              <option className="bg-neutral-950 text-orange-100">Endpoint detection & response</option>
              <option className="bg-neutral-950 text-orange-100">SIEM / SOAR / Splunk</option>
              <option className="bg-neutral-950 text-orange-100">AI anomaly detection & automation</option>
              <option className="bg-neutral-950 text-orange-100">Full stack assessment</option>
            </select>
          </div>
          <div>
            <label className="block text-orange-200/90 mb-1.5 text-[11px] font-semibold" htmlFor="demo-message">
              {'// SCOPE'}
            </label>
            <textarea
              id="demo-message"
              name="message"
              rows={4}
              required
              className="w-full bg-black border border-orange-700/70 text-orange-50 p-2.5 rounded focus:outline-none focus:ring-2 focus:ring-orange-400/50 text-sm resize-none placeholder:text-orange-900/80"
              placeholder="Regulatory drivers, timeline, tech stack…"
            />
          </div>
          {leadStatus === 'err' && (
            <p className="text-red-400 text-sm font-semibold">Transmission failed — check configuration or retry.</p>
          )}
          {leadStatus === 'ok' && (
            <p className="text-green-400 text-sm font-semibold">Received. We will follow up on your secure channel.</p>
          )}
          <button
            type="submit"
            disabled={sending}
            className="w-full py-3 border-2 border-orange-400 text-orange-100 text-sm font-bold uppercase tracking-wider bg-orange-950/40 hover:bg-orange-500/20 disabled:opacity-50"
          >
            {sending ? 'ENCRYPTING…' : 'SUBMIT REQUEST'}
          </button>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// NAVIGATION & PROGRESS
// ============================================================

function ProgressDots({ current, onChange }: { current: ActIndex; onChange: (i: ActIndex) => void }) {
  const [hovered, setHovered] = useState<number | null>(null);

  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col gap-3">
      {ACTS.map((act, i) => (
        <div key={act.id} className="relative flex items-center justify-end gap-2">
          {/* Tooltip on hover */}
          {hovered === i && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 bg-[#141720] border border-[#1e2330] px-3 py-1 rounded text-[11px] font-mono text-[#00d4ff] whitespace-nowrap z-50">
              {act.label}
            </div>
          )}
          <button
            onMouseEnter={() => setHovered(i)}
            onMouseLeave={() => setHovered(null)}
            onClick={() => onChange(i as ActIndex)}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              i === current
                ? 'bg-green-400 scale-150 shadow-[0_0_8px_#00ff41]'
                : 'bg-gray-600 hover:bg-gray-400'
            }`}
          />
        </div>
      ))}
    </div>
  );
}

// ============================================================
// MAIN PAGE
// ============================================================

export default function DemoPage() {
  const router = useRouter();
  const [act, setAct] = useState<ActIndex>(0);
  const [loaded, setLoaded] = useState(false);
  const [stackFocus, setStackFocus] = useState<StackLayerId | null>(null);

  useEffect(() => {
    if (act !== 6 && act !== 7) {
      setStackFocus(null);
    }
  }, [act]);

  const nextAct = useCallback(() => {
    setAct((prev) => (prev < 7 ? (prev + 1) as ActIndex : prev));
  }, []);

  const prevAct = useCallback(() => {
    setAct((prev) => (prev > 0 ? (prev - 1) as ActIndex : prev));
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ') {
        e.preventDefault();
        nextAct();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prevAct();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [nextAct, prevAct]);

  // Simulate loading progress
  const [loadProgress, setLoadProgress] = useState(0);
  const [loadedModels, setLoadedModels] = useState<string[]>([]);

  useEffect(() => {
    if (!loaded) {
      const models = ['server_rack.glb', 'check_point_router.glb', 'splunk_mobile.glb'];
      let progress = 0;
      const interval = setInterval(() => {
        progress += Math.random() * 15;
        if (progress >= 100) {
          progress = 100;
          setLoadProgress(100);
          setLoadedModels(models);
          clearInterval(interval);
        } else {
          setLoadProgress(progress);
          // Randomly mark models as loaded
          const loadedSoFar = models.filter((_, i) => (progress / 100) * 3 > i);
          setLoadedModels(loadedSoFar);
        }
      }, 200);
      return () => clearInterval(interval);
    }
  }, [loaded]);

  return (
    <div className="h-screen w-screen bg-[#0a0c10] overflow-hidden relative">
      {/* Loading Screen - outside Canvas */}
      {!loaded && <LoadingScreen progress={loadProgress} loaded={loadedModels} />}

      {/* 3D Canvas */}
      <div className="absolute inset-0">
        <Canvas
          camera={{ position: [0, 2, 8], fov: 45 }}
          onPointerMissed={() => (act === 6 || act === 7) && setStackFocus(null)}
        >
          <Suspense fallback={null}>
            <DemoScene
              act={act}
              loaded={loaded}
              onLoaded={() => setLoaded(true)}
              stackFocus={stackFocus}
              onStackFocus={setStackFocus}
            />
          </Suspense>
        </Canvas>
      </div>

      {/* Top Nav - Exit button on right side */}
      <div className="absolute top-4 right-4 z-40">
        <button
          onClick={() => router.push('/')}
          className="font-mono text-green-400 text-xs border border-green-800 bg-black/80 px-3 py-2 hover:bg-green-900/30 transition-colors"
        >
          {`EXIT DEMO >`}
        </button>
      </div>

      {/* Act indicator */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-40">
        <div className="font-mono text-xs text-gray-500 bg-black/80 px-3 py-1 rounded">
          ACT {act + 1}/{ACTS.length}: <span className="text-green-400">{ACTS[act].label.toUpperCase()}</span>
        </div>
      </div>

      {/* Progress dots */}
      <ProgressDots current={act} onChange={setAct} />

      {/* Overlay content */}
      <ActOverlay act={act} />
      {act === 7 && <ActSevenPanel stackFocus={stackFocus} onStackFocus={setStackFocus} />}

      {/* Bottom CTA */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-40">
        {act === 7 ? (
          <div className="flex gap-4">
            <button
              onClick={() => setAct(0)}
              className="px-6 py-3 border border-green-500 text-green-400 font-mono text-sm hover:bg-green-900/30 transition-colors"
            >
              {`⟳ REPLAY SIMULATION`}
            </button>
            <button
              onClick={() => router.push('/services')}
              className="px-6 py-3 border border-yellow-500 text-yellow-400 font-mono text-sm hover:bg-yellow-900/30 transition-colors"
            >
              {`TALK TO OUR TEAM →`}
            </button>
          </div>
        ) : (
          <button
            onClick={nextAct}
            className="px-8 py-4 border-2 border-green-500 text-green-400 font-mono text-lg hover:bg-green-900/30 transition-colors animate-pulse"
          >
            {`NEXT ACT ›`}
          </button>
        )}
      </div>

      {/* Keyboard hint */}
      <div className="absolute bottom-4 right-4 z-40 font-mono text-[10px] text-gray-600">
        ← → to navigate
      </div>

      {/* Scanlines overlay */}
      <div
        className="absolute inset-0 pointer-events-none z-30 opacity-5"
        style={{
          background: 'repeating-linear-gradient(0deg, transparent, transparent 2px, #000 2px, #000 4px)',
        }}
      />
    </div>
  );
}