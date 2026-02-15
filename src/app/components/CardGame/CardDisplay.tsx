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
    onLaunch?: () => void;
}

export default function CardDisplay({ index, position, isAnalyzed, onLaunch }: CardDisplayProps) {
    const modelPath = CARD_MODELS[index];
    const groupRef = useRef<THREE.Group>(null); 

    // Load model
    const gltf = useGLTF(`/models/${modelPath}`);
    const scene = gltf.scene;

    // --- Animation Logic ---
    useFrame((state, delta) => {
        if (groupRef.current) {
            // Smoothly rotate to target
            // If analyzed (flipped), we want to show the FRONT (Face).
            // If NOT analyzed (in hand), we want to show the BACK.
            
            // Testing has shown that:
            // Math.PI = Shows the BACK of the card (Blue pattern).
            // 0 = Shows the FRONT of the card (Face).
            
            // Therefore:
            // Analyzed -> Face -> 0
            // Not Analyzed -> Back -> Math.PI
            
            const targetY = isAnalyzed ? 0 : Math.PI;
            
            // We use a simple lerp for smooth transition
            groupRef.current.rotation.y = THREE.MathUtils.lerp(
                groupRef.current.rotation.y, 
                targetY, 
                delta * 5
            );
        }
    });

    if (!scene) return null;

    // --- Scaling and Positioning Logic ---
    const handScale = 0.25; 

    // 1. Determine the final scale
    const finalScale = isAnalyzed ? ANALYZE_SCALE : handScale;

    // 2. Determine the final position
    // If analyzed, we override the hand position to the center
    const finalPosition = isAnalyzed ? ANALYZE_POSITION : position;
    
    const synopsis = CARD_SYNOPSES[index];

    return (
        <group 
            ref={groupRef}
            position={finalPosition} 
            scale={[finalScale, finalScale, finalScale]} 
            rotation={[0, Math.PI, 0]} // Start facing BACK (Math.PI)
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
