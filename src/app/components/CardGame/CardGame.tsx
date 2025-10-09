// components/CardGame/CardGame.tsx
'use client';

import { useState, useCallback, useLayoutEffect } from 'react';
import { Canvas, useThree, useStore } from '@react-three/fiber'; 
import { Environment } from '@react-three/drei'; 
import * as THREE from 'three';
import CardDisplay from './CardDisplay'; 
import Link from 'next/link'; 
// 1. IMPORT SYNOPSIS DATA
import { CARD_SYNOPSES } from './CardSynopses'; 

// --- Configuration ---
const CARD_COUNT = 5;
const ANALYSIS_DURATION_MS = 8000; // 10 seconds

const CARD_SYNOPSIS_TITLES = [
    'ACHIEVEMENTS: KING OF CLUBS', 
    'EDCUATION: QUEEN OF CLUBS', 
    'PROJECTS: JACK OF HEARTS', 
    'EXPERIENCE: ACE OF SPADES', 
    'BLOGSITE: TEN OF HEARTS'
];

interface CardGameProps {
    collectedCards: boolean[];
    onCardCollect: (index: number) => void;
    onExit: () => void;
}

// --- Hand Position/Rotation Setup for Fanned Effect ---
const BASE_HAND_Y = 0.01; 
const HAND_POSITIONS_X: number[] = [-1.5, -0.75, 0, 0.75, 1.5]; 
const CARD_ROTATIONS_Z: number[] = [0.15, 0.05, 0, -0.05, -0.15]; 

const HAND_POSITIONS: [number, number, number][] = HAND_POSITIONS_X.map(x => [x, BASE_HAND_Y, 0]);

// --- CANVAS INTERACTION HANDLER (R3F Context) ---
interface CanvasInteractionHandlerProps {
    analyzedCardIndex: number | null;
}

function CanvasInteractionHandler({ analyzedCardIndex }: CanvasInteractionHandlerProps) {
    const { invalidate } = useThree(); 
    const store = useStore(); 
    
    const setFrameloop = useCallback((mode: 'always' | 'demand') => {
        store.setState({ frameloop: mode });
    }, [store]);

    useLayoutEffect(() => {
        invalidate(); 
    }, [analyzedCardIndex, invalidate]); 
    
    useLayoutEffect(() => {
        if (analyzedCardIndex !== null) {
            setFrameloop('always');
        } else {
            setFrameloop('demand');
        }
    }, [analyzedCardIndex, setFrameloop]);

    return null; 
}


// --- STATIC CAMERA ---
function StaticCamera() {
    const { camera, size, invalidate } = useThree(); 
    
    const fixedPosition: [number, number, number] = [0, 0, 5]; 
    const fixedTarget: [number, number, number] = [0, 0, 0];
    const frustumSize = 7; 
    const fixedZoom = 1.8; 

    // 🛑 R3F Hook Dependency Warning Fix: Ignore the rule for this specific use case
    // eslint-disable-next-line react-hooks/exhaustive-deps
    const updateCamera = useCallback(() => {
        camera.position.set(...fixedPosition);
        camera.lookAt(...fixedTarget);
        camera.zoom = fixedZoom; 
        
        if (camera instanceof THREE.OrthographicCamera) {
            const aspect = size.width / size.height;
            
            camera.left = -frustumSize * aspect / 2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
        }
        
        camera.updateProjectionMatrix();
        invalidate(); 
        
    }, [camera, size.width, size.height, invalidate]);


    useLayoutEffect(() => {
        updateCamera();
    }, [updateCamera]); 

    return null; 
}


// --- Interactive Card Component ---
interface InteractiveCardProps {
    index: number;
    onCardClick: (index: number) => void;
    position: [number, number, number];
    cardRotationZ: number; 
}

function InteractiveCard({ index, onCardClick, position, cardRotationZ }: InteractiveCardProps) {
    return (
        <group 
            onClick={() => onCardClick(index)}
            rotation={[0, 0, cardRotationZ]} 
            // Ensures cursor changes on hover and prevents event bleed-through
            onPointerOver={(e) => {
                e.stopPropagation(); 
                document.body.style.cursor = 'pointer';
            }}
            onPointerOut={(e) => {
                e.stopPropagation();
                document.body.style.cursor = 'default';
            }}
        >
            <CardDisplay 
                index={index} 
                position={position} 
                isDisplayed={false} 
                isClicked={false}
                isAnalyzed={false}
            />
        </group>
    );
}


export default function CardGame({ collectedCards, onCardCollect, onExit }: CardGameProps) {
    // Initial message reflects CV is ready, but cards are for detail
    const [message, setMessage] = useState("CV ACCESS GRANTED. SELECT A CARD for project data analysis.");
    const [analyzedCardIndex, setAnalyzedCardIndex] = useState<number | null>(null); 
    const [isAnalysisComplete, setIsAnalysisComplete] = useState(false);
    
    // CV is always enabled now
    const allCardsCollected = true; 
    const isInteractionBlocked = analyzedCardIndex !== null;
    
    // Set message color based on state
    const messageColor = analyzedCardIndex !== null ? 'text-red-400' : (collectedCards.some(Boolean) ? 'text-green-400' : 'text-yellow-400');


    const handleCardClick = useCallback((index: number) => {
        if (isInteractionBlocked || collectedCards[index]) return; 

        // 1. Begin Analysis Sequence
        setAnalyzedCardIndex(index);
        setMessage(`ANALYZING: ${CARD_SYNOPSIS_TITLES[index]}... 5-second data retrieval commencing.`);
        
        // 2. Set Timeout to stop analysis and collect the card
        setTimeout(() => {
            setAnalyzedCardIndex(null); 
            onCardCollect(index); // Still mark the card as collected 
            
                setIsAnalysisComplete(true);
                // Status message after collection
                setMessage(`ANALYSIS COMPLETE: Data fragment retrieved for ${CARD_SYNOPSIS_TITLES[index]}. SELECT ANOTHER CARD or use the download link.`);
                setTimeout(() => setIsAnalysisComplete(false), 1000); 
        }, ANALYSIS_DURATION_MS); 

    }, [onCardCollect, isInteractionBlocked, collectedCards]);


    return (
        <> 
            <div className="flex flex-col h-full w-full p-2 bg-black">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-700">
                    <h2 className="text-xl text-yellow-400 font-bold">DATA RETRIEVAL: cards.exe</h2>
                    <div className="flex space-x-2"> 
                        {/* CV Download Button (ALWAYS ACTIVE, disabled only during analysis) */}
                        <Link 
                            href="/cv/Owen-Van-Wyk-Resume.pdf" // 👈 UPDATE THIS PATH
                            download 
                            className={`px-3 py-1 text-sm transition-colors font-bold ${
                                !isInteractionBlocked
                                    ? 'text-white bg-green-600 hover:bg-green-400 border border-green-600'
                                    : 'text-gray-600 bg-gray-900 border border-gray-600 cursor-not-allowed'
                            }`}
                            aria-disabled={isInteractionBlocked}
                            onClick={(e) => {
                                if (isInteractionBlocked) e.preventDefault();
                            }}
                        >
                            [💾] DOWNLOAD CV
                        </Link>

                        {/* Exit to Terminal Button (Always Visible, Conditionally Disabled) */}
                        <button 
                            onClick={onExit} 
                            disabled={isInteractionBlocked}
                            className={`px-3 py-1 text-sm transition-colors font-mono ${
                                isInteractionBlocked 
                                ? 'text-gray-600 border border-gray-600 cursor-not-allowed' 
                                : 'text-red-400 hover:text-red-200 border border-red-400'
                            }`}
                        >
                            [X] EXIT TO TERMINAL
                        </button>
                    </div>
                </div>

                <div className="h-[calc(100%-6rem)] border border-green-700 bg-gray-900 relative">
                    
                    <Canvas 
                        frameloop="demand" 
                        orthographic 
                        className="w-full h-full"
                        {/* 🛑 FIX: Explicitly include all required RaycasterParameters */}
                        raycaster={{ 
                            params: { 
                                Mesh: { material: true },
                                Line: {},
                                LOD: {},
                                Points: {},
                                Sprite: {},
                            } 
                        }}
                    >
                        <StaticCamera />
                        
                        <CanvasInteractionHandler analyzedCardIndex={analyzedCardIndex} /> 
                        
                        <ambientLight intensity={0.5} />
                        <directionalLight position={[10, 10, 5]} intensity={1} />
                        <Environment preset="night" />

                        {/* RENDER ANALYZED CARD (Top-Left, Rotating) */}
                        {analyzedCardIndex !== null && (
                            <CardDisplay 
                                key={`analyze-${analyzedCardIndex}`} 
                                index={analyzedCardIndex} 
                                position={[0, 0, 0]} 
                                isDisplayed={false} 
                                isAnalyzed={true}
                            />
                        )}

                        {/* Renders ONLY UNCOLLECTED cards in the hand */}
                        {collectedCards.map((isCollected, index) => (
                            !isCollected && analyzedCardIndex !== index && (
                            <InteractiveCard
                                key={index}
                                index={index}
                                onCardClick={handleCardClick} 
                                position={HAND_POSITIONS[index]}
                                cardRotationZ={CARD_ROTATIONS_Z[index]}
                            />
                            )
                        ))}
                    </Canvas>
                    
                    {/* Analysis Synopsis (Top-Left) */}
                    {analyzedCardIndex !== null && (
                        <div className="absolute top-5 left-5 p-4 border border-red-500 bg-black/70 text-sm w-[600px] text-left"> 
                            <p className="text-red-400 font-bold mb-2">NETWORK ANALYSIS IN PROGRESS...</p>
                            {/* DISPLAY SYNOPSIS: uses CARD_SYNOPSES data */}
                            <p className="text-white font-bold mb-1">{CARD_SYNOPSIS_TITLES[analyzedCardIndex]}</p>
                            <p className="text-white whitespace-pre-wrap">{CARD_SYNOPSES[analyzedCardIndex]}</p>
                        </div>
                    )}

                    {/* Collection Complete Message */}
                    {isAnalysisComplete && (
                         <div className='absolute inset-0 flex justify-center items-center text-2xl text-green-400 bg-black/70'>
                           FRAGMENT RETRIEVED.
                       </div>
                    )}
                </div>
                
                {/* Status Area */}
                <div className={`mt-2 text-sm font-mono ${messageColor}`}>
                    {message}
                </div>
            </div>
        </>
    );
}