// components/SystemStartup/SystemStartup.tsx
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect, useState } from "react"; 
import { useGLTF, OrbitControls, Points, PointMaterial } from "@react-three/drei";
import * as THREE from 'three'; 

import TerminalScreen from "../TerminalScreen/TerminalScreen"; 

// --- Configuration ---
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal';

const START_POSITION = new THREE.Vector3(-0.9, 0.9, 6);
const TARGET_POSITION = new THREE.Vector3(-0.3, 0.2, 1.2);
const LOOK_AT_POINT = new THREE.Vector3(-0.3, 0.2, 0.8);
const ZOOM_SPEED = 0.05;

// 1. Component to handle the Camera Zoom Animation
function CameraZoom({ appState, onZoomComplete }: { appState: AppState, onZoomComplete: () => void }) {
    const { camera } = useThree();

    useEffect(() => {
        // FIX: Ensure initialization runs only once on mount to prevent null/undefined errors.
        camera.position.copy(START_POSITION);
    }, [camera.position]); // Empty dependency array is the fix

    useFrame(() => {
        if (appState === 'zooming') {
            camera.position.lerp(TARGET_POSITION, ZOOM_SPEED);
            camera.lookAt(LOOK_AT_POINT); 

            if (camera.position.distanceTo(TARGET_POSITION) < 0.1) {
                onZoomComplete();
                camera.position.copy(TARGET_POSITION);
            }
        }
    });
    return null; 
}


// 2. ClickableScreen
interface ClickableScreenProps { onScreenClick: () => void; }
function ClickableScreen({ onScreenClick }: ClickableScreenProps) {
    // Large invisible hit volume covering the CRT bezel + screen (FullComp monitor sits ~center-left in view)
    return (
        <mesh
            position={[-0.22, 0.38, 0.62]}
            scale={[2.85, 2.35, 0.2]}
            onClick={(e) => {
                e.stopPropagation();
                onScreenClick();
            }}
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
        </mesh>
    );
}

// 3. ComputerModel (Fix for GLTF Group already incorporated)
function ComputerModel() {
    const { scene } = useGLTF("/models/FullComp.glb");
    
    return (
        <group 
            scale={0.5}
            position={[0.4, 0.1, 0.4]} 
            rotation={[0, Math.PI, 0]}
        >
            <primitive object={scene} />
        </group>
    );
}
useGLTF.preload("/models/FullComp.glb");


// 4. DigitalRain
function DigitalRain() {
    const count = 2000;
    const [positions] = useState(() => {
        const pos = new Float32Array(count * 3);
        for (let i = 0; i < count; i++) {
            pos[i * 3] = (Math.random() - 0.5) * 10;
            pos[i * 3 + 1] = Math.random() * 10;
            pos[i * 3 + 2] = (Math.random() - 0.5) * 10;
        }
        return pos;
    });

    useFrame((state, delta) => {
        for (let i = 0; i < count; i++) {
            positions[i * 3 + 1] -= delta * 2;
            if (positions[i * 3 + 1] < -5) {
                positions[i * 3 + 1] = 5;
            }
        }
    });

    return (
        <Points positions={positions} stride={3}>
            <PointMaterial
                transparent
                color="#22c55e"
                size={0.02}
                sizeAttenuation={true}
                depthWrite={false}
                opacity={0.4}
            />
        </Points>
    );
}

// 5. Main SystemStartup Component
interface SystemStartupProps {
    appState: AppState; // Cast to AppState to remove 'game' since it's now internal to TerminalScreen
    onScreenClick: () => void;
    onOsLoadComplete: () => void; 
    onTerminalExecute: (command: 'cards.exe' | 'blog.exe') => void;
    onZoomComplete: () => void;
}

export default function SystemStartup({ 
    appState, 
    onScreenClick, 
    onOsLoadComplete, 
    onTerminalExecute,
    onZoomComplete 
}: SystemStartupProps) {
    
    // Cast the state for simpler conditional rendering
    const isIdle = appState === 'idle';

    return (
        <div 
            className="h-screen w-screen overflow-hidden" 
            style={{ 
                backgroundImage: "url('/images/basement-dweller.jpg')", 
                backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat', 
            }}
        >
            {/* A. Terminal Screen Overlay */}
            {(appState === 'booting' || appState === 'os_load' || appState === 'terminal') && (
                <TerminalScreen 
                    appState={appState} 
                    onOsLoadComplete={onOsLoadComplete} 
                    onTerminalExecute={onTerminalExecute}
                />
            )}

            <Canvas camera={{ position: START_POSITION.toArray(), fov: 21 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[-5, 5, 5]} intensity={3} /> 
                
                {/* B. Camera Zoom Logic */}
                <CameraZoom 
                    appState={appState} 
                    onZoomComplete={onZoomComplete} 
                /> 

                {/* C. Orbit Controls */}
                <OrbitControls 
                    enableDamping 
                    dampingFactor={0.05} 
                    enabled={appState === 'terminal'} 
                />
                
                <Suspense fallback={null}>
                    <ComputerModel />
                    <DigitalRain />
                    
                    {/* D. Clickable Screen */}
                    {isIdle && <ClickableScreen onScreenClick={onScreenClick} />}

                </Suspense>
            </Canvas>
        </div>
    );
}