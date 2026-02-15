'use client';

import { useGLTF, Html } from '@react-three/drei';
import { useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';
import { useRef } from 'react';
import { CARD_SYNOPSES } from './CardSynopses';

// --- Global Configuration ---
const CARD_MODELS = [
    "KingOfClubs.glb", 
    "QueenOfClubs.glb", 
    "JackOfHearts.glb", 
    "AceOfSpades.glb", 
    "10OfHearts.glb", 
];

// Reverting to Top-Left Configuration for the Analysis (Rotating) state:
// Actually, we want it center or prominent if we are reading text.
// Let's keep it somewhat centered but maybe zoomed in?
// The StaticCamera in CardGame fixes the view.
const ANALYZE_POSITION: [number, number, number] = [0, 0, 2]; // Center and closer
const ANALYZE_SCALE = 0.6; 

interface CardDisplayProps {
    index: number;
    position: [number, number, number];
    isDisplayed?: boolean; 
    isClicked?: boolean; 
    isAnalyzed: boolean; 
    isHovered?: boolean;
    onLaunch?: () => void;
}

export default function CardDisplay({ index, position, isAnalyzed, isHovered, onLaunch }: CardDisplayProps) {
    const modelPath = CARD_MODELS[index];
    const groupRef = useRef<THREE.Group>(null); 

    // Load model
    const gltf = useGLTF(`/models/${modelPath}`);
    const scene = gltf.scene;

    useFrame((state, delta) => {
        if (groupRef.current) {
            // Target Rotation Y:
            const targetRotY = isAnalyzed ? 0 : Math.PI;

            // Target Position:
            const targetPos = isAnalyzed ? new THREE.Vector3(0, 0, 0) : new THREE.Vector3(...position);

            // Target Scale:
            const handScale = 0.25; 
            const analyzeScale = 0.6; 
            const targetScale = isAnalyzed ? analyzeScale : handScale;

            // Smooth Interpolation (Lerp)
            // 1. Rotation
            if (isAnalyzed) {
                // If analyzed, force target rotation
                groupRef.current.rotation.y = THREE.MathUtils.lerp(
                    groupRef.current.rotation.y, 
                    targetRotY, 
                    delta * 5
                );
            } else if (!isHovered) {
                // If NOT analyzed AND NOT hovered, go to base rotation
                groupRef.current.rotation.y = THREE.MathUtils.lerp(
                    groupRef.current.rotation.y, 
                    targetRotY, 
                    delta * 5
                );
            }

            // 2. Position
            if (isAnalyzed) {
                // If analyzed, force target position
                groupRef.current.position.lerp(targetPos, delta * 5);
            } else if (!isHovered) {
                // If NOT analyzed AND NOT hovered, go to base position
                groupRef.current.position.lerp(targetPos, delta * 5);
            }

            // 3. Scale
            const currentScale = groupRef.current.scale.x;
            const newScale = THREE.MathUtils.lerp(currentScale, targetScale, delta * 5);
            groupRef.current.scale.set(newScale, newScale, newScale);
            
            // 4. Hover Rotation (Only if NOT analyzed)
            // When hovered, rotate slightly to show a bit of the side/face (peek)
            if (!isAnalyzed && isHovered) {
                 // Peek rotation: Rotate slightly away from Math.PI towards 0
                 const hoverTargetRotY = Math.PI - 0.5; 
                 groupRef.current.rotation.y = THREE.MathUtils.lerp(
                     groupRef.current.rotation.y,
                     hoverTargetRotY,
                     delta * 8 
                 );
                 
                 // Also lift slightly?
                 const hoverTargetY = position[1] + 0.3; 
                 groupRef.current.position.y = THREE.MathUtils.lerp(
                    groupRef.current.position.y,
                    hoverTargetY,
                    delta * 8
                 );
            }
        }
    });

    if (!scene) return null;
    
    // We initialize with the "start" values, but useFrame handles the updates
    // So we don't need to pass position/scale directly to the group prop anymore, 
    // EXCEPT for the initial render to prevent jumping.
    // However, if we want smooth transition FROM the start, we can let useFrame handle it from 0.

    const synopsis = CARD_SYNOPSES[index];

    return (
        <group 
            ref={groupRef}
            // Initial position/rotation/scale can be set here, but useFrame will override.
            // Setting initial values to match "Not Analyzed" state prevents jump on load.
            position={position} 
            rotation={[0, Math.PI, 0]} 
            scale={[0.25, 0.25, 0.25]}
        >
            {/* renderOrder=1 ensures the analyzed card is always drawn on top */}
            <primitive object={scene.clone()} renderOrder={isAnalyzed ? 1 : 0} /> 

            {/* Content Reveal on Flip */}
            {isAnalyzed && (
                <Html 
                    position={[0, 0, 0.2]} // Slightly in front of the card face
                    transform 
                    occlude 
                    center
                    distanceFactor={1.5}
                >
                    <div className="w-64 bg-black/90 border border-green-500 p-4 text-[10px] md:text-xs font-mono text-green-400 shadow-lg shadow-green-900/50 flex flex-col gap-2">
                        <div className="whitespace-pre-wrap leading-tight">
                            {synopsis}
                        </div>
                        <button 
                            onClick={(e) => {
                                e.stopPropagation();
                                onLaunch?.();
                            }}
                            className="mt-2 w-full py-1 bg-green-700 text-black font-bold hover:bg-green-500 transition-colors uppercase"
                        >
                            LAUNCH_MODULE &gt;&gt;
                        </button>
                    </div>
                </Html>
            )}
        </group>
    );
}

// --- Preloading ---
CARD_MODELS.forEach(model => useGLTF.preload(`/models/${model}`));
