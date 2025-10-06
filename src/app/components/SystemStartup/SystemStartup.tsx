// components/SystemStartup/SystemStartup.tsx
"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { Suspense, useEffect } from "react"; // 🛑 Removed useState
import { useGLTF, OrbitControls } from "@react-three/drei";
import * as THREE from 'three'; 

import TerminalScreen from "../TerminalScreen/TerminalScreen"; 

// --- Configuration ---
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal';

const START_POSITION = new THREE.Vector3(-0.9, 0.9, 6);
const TARGET_POSITION = new THREE.Vector3(-0.3, 0.2, 1.2);
const LOOK_AT_POINT = new THREE.Vector3(-0.3, 0.2, 0.8);
const ZOOM_SPEED = 0.05;

// 1. Component to handle the Camera Zoom Animation
// 🛑 IMPORTANT: This component must now call the PARENT (Home/page.tsx) function 
// to change the state to 'booting', instead of using a local setAppState.
function CameraZoom({ appState, onZoomComplete }: { appState: AppState, onZoomComplete: () => void }) {
    const { camera } = useThree();

    useEffect(() => {
        camera.position.copy(START_POSITION);
    }, [camera]);

    useFrame(() => {
        if (appState === 'zooming') {
            camera.position.lerp(TARGET_POSITION, ZOOM_SPEED);
            camera.lookAt(LOOK_AT_POINT); 

            if (camera.position.distanceTo(TARGET_POSITION) < 0.1) {
                // 🛑 NEW: Call the PARENT callback when zoom is done
                onZoomComplete();
                camera.position.copy(TARGET_POSITION);
            }
        }
    });
    return null; 
}


// 2. ClickableScreen and 3. ComputerModel remain the same...
interface ClickableScreenProps { onScreenClick: () => void; }
function ClickableScreen({ onScreenClick }: ClickableScreenProps) {
    const monitorPosition = new THREE.Vector3(-0.3, 0.2, 0.8);
    const monitorScale = new THREE.Vector3(1, 0.9, 0.01); 
    return (
        <mesh 
            position={monitorPosition}
            scale={monitorScale}
            onClick={onScreenClick} 
        >
            <boxGeometry args={[1, 1, 1]} />
            <meshBasicMaterial transparent opacity={0} />
        </mesh>
    );
}
function ComputerModel() {
    const { scene } = useGLTF("/models/FullComp.glb");
    return (
        <primitive
            object={scene}
            scale={0.5}
            position={[0.4, 0.1, 0.4]} 
            rotation={[0, Math.PI, 0]}
        />
    );
}
useGLTF.preload("/models/FullComp.glb");


// 4. Main SystemStartup Component
interface SystemStartupProps {
    appState: AppState | 'game';
    onScreenClick: () => void;
    onOsLoadComplete: () => void; 
    onTerminalExecute: () => void;
    // 🛑 NEW PROP for CameraZoom to call Home/page.tsx 🛑
    onZoomComplete: () => void;
}

export default function SystemStartup({ 
    appState, // Use this directly, no local state copy
    onScreenClick, 
    onOsLoadComplete, 
    onTerminalExecute,
    onZoomComplete // Destructure new prop
}: SystemStartupProps) {
    
    // Cast the state for simpler conditional rendering
    const currentAppState = appState as AppState;
    const isIdle = currentAppState === 'idle';

    return (
        <div 
            className="h-screen w-screen overflow-hidden" 
            style={{ 
                backgroundImage: "url('/images/basement-dweller.jpg')", 
                backgroundSize: 'cover', backgroundPosition: 'center center', backgroundRepeat: 'no-repeat', 
            }}
        >
            {/* A. Terminal Screen Overlay */}
            {(currentAppState === 'booting' || currentAppState === 'os_load' || currentAppState === 'terminal') && (
                <TerminalScreen 
                    appState={currentAppState} 
                    onOsLoadComplete={onOsLoadComplete} 
                    onTerminalExecute={onTerminalExecute}
                />
            )}

            <Canvas camera={{ position: START_POSITION.toArray(), fov: 21 }}>
                <ambientLight intensity={0.6} />
                <directionalLight position={[-5, 5, 5]} intensity={3} /> 
                
                {/* B. Camera Zoom Logic */}
                <CameraZoom 
                    appState={currentAppState} 
                    onZoomComplete={onZoomComplete} // 🛑 Pass the callback here 🛑
                /> 

                {/* C. Orbit Controls */}
                <OrbitControls 
                    enableDamping 
                    dampingFactor={0.05} 
                    enabled={currentAppState === 'terminal'} 
                />
                
                <Suspense fallback={null}>
                    <ComputerModel />
                    
                    {/* D. Clickable Screen */}
                    {isIdle && <ClickableScreen onScreenClick={onScreenClick} />}

                </Suspense>
            </Canvas>
        </div>
    );
}