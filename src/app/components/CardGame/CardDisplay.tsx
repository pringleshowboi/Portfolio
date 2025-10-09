// components/CardGame/CardDisplay.tsx
'use client';

import { useGLTF } from '@react-three/drei';
import { useFrame } from '@react-three/fiber'; 
import * as THREE from 'three';
import { useRef } from 'react';

// --- Global Configuration ---
const CARD_MODELS = [
    "KingOfClubs.glb",  
    "QueenOfClubs.glb", 
    "JackOfHearts.glb", 
    "AceOfSpades.glb", 
    "10OfHearts.glb", 
];

// Reverting to Top-Left Configuration for the Analysis (Rotating) state:
const ANALYZE_POSITION: [number, number, number] = [-0.5, 0.5, 0.5]; 
const ANALYZE_SCALE = 0.5; 

interface CardDisplayProps {
    index: number;
    position: [number, number, number];
    isDisplayed?: boolean;
    isClicked?: boolean; 
    isAnalyzed: boolean; 
}

export default function CardDisplay({ index, position, isDisplayed = false, isClicked = false, isAnalyzed }: CardDisplayProps) {
    const modelPath = CARD_MODELS[index];
    const groupRef = useRef<THREE.Group>(null); 

    // 🛑 FIX 1: Move useGLTF to the top level (unconditional call)
    // We assume the modelPath is stable (doesn't change during rendering)
    let scene: THREE.Group | null = null;
    let loadedData: ReturnType<typeof useGLTF> | null = null;
    try {
        // The hook is called here unconditionally, as required by React rules.
        // We capture the result.
        loadedData = useGLTF(`/models/${modelPath}`);
        scene = loadedData.scene;
    } catch (e) {
        // Log the error but continue running the component to avoid violating hooks rules
        console.error(`Failed to load GLTF model: ${modelPath}`, e);
    }
    
    // 🛑 FIX 2: Move useFrame to the top level (unconditional call)
    useFrame((state, delta) => {
        if (isAnalyzed && groupRef.current) {
            // Rotate around the Y-axis when being analyzed
            groupRef.current.rotation.y += delta * 0.5; 
        }
    });


    // --- Early Return (NOW SAFE) ---
    // If the model load failed, we return AFTER the hooks are called.
    if (!scene) return null;


    // --- Scaling and Positioning Logic ---
    // ... (rest of logic remains unchanged)
    const handScale = 0.25; 

    // 1. Determine the final scale (Analysis overrides all)
    const finalScale = isAnalyzed 
        ? ANALYZE_SCALE 
        : handScale;

    // 2. Determine the final position
    const finalPosition = isAnalyzed 
        ? ANALYZE_POSITION // Top-left corner
        : position;
    
    // 3. Calculate Rotation
    // Card faces forward (0) in analysis, faces away (Math.PI) in the hand
    const BASE_ROTATION_Y = isAnalyzed ? 0 : Math.PI; 
    
    const initialRotation: [number, number, number] = [
        0, 
        BASE_ROTATION_Y, 
        0
    ];         

    return (
        <group 
            ref={groupRef}
            position={finalPosition} 
            scale={[finalScale, finalScale, finalScale]} 
            rotation={initialRotation}
        >
            {/* renderOrder=1 ensures the analyzed card is always drawn on top */}
            <primitive object={scene.clone()} renderOrder={isAnalyzed ? 1 : 0} /> 
        </group>
    );
}

// --- Preloading ---
CARD_MODELS.forEach(model => useGLTF.preload(`/models/${model}`));