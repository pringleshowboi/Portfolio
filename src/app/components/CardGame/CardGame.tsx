'use client';

import { useState, useCallback, useLayoutEffect, useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber'; 
import { Environment } from '@react-three/drei'; 
import * as THREE from 'three';
import CardDisplay from './CardDisplay'; 
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';

// --- Configuration ---
const CARD_SYNOPSIS_TITLES_DATA = [
    'SECURE CORE: KING OF CLUBS', 
    'AUTOMATION OPS: QUEEN OF CLUBS', 
    'AI INTEGRATION: JACK OF HEARTS', 
    'GUARDIAN AUDIT: ACE OF SPADES', 
    'FUTURE STACK: TEN OF HEARTS'
];

// Mapping of card index to redirect URLs
const CARD_URLS = [
    '/services/secure-core',        // 0
    '/services/automation-ops',     // 1
    '/services/ai-integration',     // 2
    '/services/guardian-audit',     // 3
    '/services/future-stack'        // 4
];

interface CardGameProps {
    onExit: () => void;
}

// --- Hand Position/Rotation Setup for Fanned Effect ---
const BASE_HAND_Y = 0.01; 
const HAND_POSITIONS_X: number[] = [-1.5, -0.75, 0, 0.75, 1.5]; 
const CARD_ROTATIONS_Z: number[] = [0.15, 0.05, 0, -0.05, -0.15]; 

const HAND_POSITIONS: [number, number, number][] = HAND_POSITIONS_X.map(x => [x, BASE_HAND_Y, 0]);

// --- STATIC CAMERA ---
function StaticCamera({ zoomLevel }: { zoomLevel: number }) {
    const { camera, size, invalidate } = useThree(); 
    
    const updateCamera = useCallback(() => {
        const fixedPosition: [number, number, number] = [0, 0, 5]; 
        const fixedTarget: [number, number, number] = [0, 0, 0];
        const frustumSize = 7; 
        
        camera.position.set(...fixedPosition);
        camera.lookAt(...fixedTarget);
        camera.zoom = zoomLevel; // Use dynamic zoom
        
        if (camera instanceof THREE.OrthographicCamera) {
            const aspect = size.width / size.height;
            
            camera.left = -frustumSize * aspect / 2;
            camera.right = frustumSize * aspect / 2;
            camera.top = frustumSize / 2;
            camera.bottom = -frustumSize / 2;
        }
        
        camera.updateProjectionMatrix();
        invalidate(); 
        
    }, [camera, size.width, size.height, invalidate, zoomLevel]);


    useLayoutEffect(() => {
        updateCamera();
    }, [updateCamera]); 

    return null; 
}


// --- Interactive Card Component ---
interface InteractiveCardProps {
    index: number;
    onCardClick: (index: number) => void;
    onCardHover: (index: number | null) => void;
    onCardLaunch: (index: number) => void;
    position: [number, number, number];
    cardRotationZ: number; 
    isFlipped: boolean;
    isHovered: boolean;
}

function InteractiveCard({ index, onCardClick, onCardHover, onCardLaunch, position, cardRotationZ, isFlipped, isHovered }: InteractiveCardProps) {
    return (
        <group 
            onClick={(e) => {
                e.stopPropagation();
                onCardClick(index);
            }}
            rotation={[0, 0, cardRotationZ]} 
            // Ensures cursor changes on hover and prevents event bleed-through
            onPointerOver={(e) => {
                e.stopPropagation(); 
                document.body.style.cursor = 'pointer';
                onCardHover(index);
            }}
            onPointerOut={(e) => {
                e.stopPropagation(); 
                document.body.style.cursor = 'default';
                onCardHover(null);
            }}
        >
            <CardDisplay 
                index={index} 
                position={position} 
                isDisplayed={false} 
                isClicked={false}
                isAnalyzed={isFlipped} // Reuse isAnalyzed logic for the flip/focus state
                isHovered={isHovered} // Pass hover state
                onLaunch={() => onCardLaunch(index)}
            />
        </group>
    );
}


export default function CardGame({ onExit }: CardGameProps) {
    const router = useRouter();
    const [message, setMessage] = useState("SELECT A SERVICE CARD TO INSPECT");
    const [flippedIndex, setFlippedIndex] = useState<number | null>(null);
    const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

    const handleCardClick = useCallback((index: number) => {
        if (flippedIndex === index) {
            // If already flipped, maybe we want to launch?
            // For now, let's just toggle off or do nothing (launch is handled by button on card)
            // But user might expect clicking again to close.
            setFlippedIndex(null);
            setMessage("SELECT A SERVICE CARD TO INSPECT");
        } else {
            setFlippedIndex(index);
            setMessage(`INSPECTING: ${CARD_SYNOPSIS_TITLES_DATA[index]}...`);
        }
    }, [flippedIndex]);

    const handleCardHover = useCallback((index: number | null) => {
        setHoveredIndex(index);
    }, []);

    const handleLaunch = useCallback((index: number) => {
        const url = CARD_URLS[index];
        if (url) {
            setMessage(`LAUNCHING MODULE: ${CARD_SYNOPSIS_TITLES_DATA[index]}...`);
            router.push(url);
        }
    }, [router]);

    // Determine which index to highlight in the list
    const activeIndex = flippedIndex !== null ? flippedIndex : hoveredIndex;

    const [zoomLevel, setZoomLevel] = useState(1.8);
    const [isZoomed, setIsZoomed] = useState(false);

    // Zoom on click, reset on close
    useEffect(() => {
        if (flippedIndex !== null) {
            setZoomLevel(2.5);
            setIsZoomed(true);
        } else {
            setZoomLevel(1.8);
            setIsZoomed(false);
        }
    }, [flippedIndex]);

    const handleZoomToggle = useCallback(() => {
        setZoomLevel(prev => prev === 1.8 ? 2.5 : 1.8);
    }, []);

    // Handle Escape Key to Exit
    useLayoutEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                if (flippedIndex !== null) {
                    setFlippedIndex(null); // Close card inspection first
                } else {
                    onExit(); // Exit game
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onExit, flippedIndex]);

    return (
        <> 
            <div className="flex flex-col h-full w-full p-2 bg-black relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-700">
                    <h2 className="text-xl text-yellow-400 font-bold">SERVICE CATALOG: services.exe</h2>
                    <div className="flex space-x-2"> 
                        <Link 
                            href="/cv/OWEN-VAN-WYK-RESUME.pdf"
                            download 
                            className="px-3 py-1 text-xs md:text-sm transition-colors font-bold text-black bg-yellow-500 hover:bg-yellow-400 border border-yellow-600 uppercase"
                        >
                            [🗁] SYSTEM_CAPABILITIES.PDF
                        </Link>
                        <button 
                            onClick={onExit} 
                            className="px-3 py-1 text-xs md:text-sm text-white bg-red-600 hover:bg-red-400 border border-red-600 transition-colors font-bold"
                        >
                            [X] EXIT
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative border border-green-700 bg-gray-900 overflow-hidden flex flex-col md:flex-row">
                    
                    {/* ZOOM CONTROL OVERLAY */}
                    <div className="absolute top-4 left-4 z-30">
                         <button 
                            onClick={handleZoomToggle}
                            className="p-2 border border-green-500 bg-black/80 text-green-400 hover:bg-green-900/50 hover:text-white transition-colors text-xs font-mono uppercase"
                         >
                            [ {isZoomed ? '-' : '+'} ] ZOOM_OPTICS
                         </button>
                    </div>

                    {/* LEFT SIDE: 3D CARDS */}
                    <div className="flex-1 h-full relative z-10 order-2 md:order-1">
                        <Canvas 
                            frameloop="demand" 
                            orthographic 
                            className="w-full h-full"
                            raycaster={{ 
                                params: { 
                                    Mesh: { material: true },
                                    Line: { threshold: 0.1 }, 
                                    LOD: {},
                                    Points: { threshold: 0.1 }, 
                                    Sprite: { threshold: 0.1 }, 
                                } 
                            }}
                        >
                            <StaticCamera zoomLevel={zoomLevel} />
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1} />
                            <Environment preset="night" />

                            {/* Renders cards in hand */}
                            {HAND_POSITIONS.map((pos, index) => (
                                <InteractiveCard
                                    key={index}
                                    index={index}
                                    onCardClick={handleCardClick}
                                    onCardHover={handleCardHover}
                                    onCardLaunch={handleLaunch}
                                    position={pos}
                                    cardRotationZ={CARD_ROTATIONS_Z[index]}
                                    isFlipped={flippedIndex === index}
                                    isHovered={hoveredIndex === index}
                                />
                            ))}
                            
                            {/* Plane to catch raycasts for empty space clicks (optional, but helps with UX) */}
                            <mesh position={[0, 0, -1]} onClick={(e) => { e.stopPropagation(); setFlippedIndex(null); }}>
                                <planeGeometry args={[50, 50]} />
                                <meshBasicMaterial visible={false} />
                            </mesh>
                        </Canvas>
                    </div>

                    {/* RIGHT SIDE: LADY JUSTICE & SERVICE LIST */}
                    <div className="w-full md:w-1/3 h-1/3 md:h-full border-t md:border-t-0 md:border-l border-green-800 bg-black/80 flex flex-col p-4 z-20 overflow-y-auto order-1 md:order-2">
                        
                        <div className="flex flex-col items-center mb-4 md:mb-6">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src="/images/lady-justice.png" 
                                alt="Lady Justice" 
                                className="w-20 h-20 md:w-40 md:h-40 object-contain mb-2 opacity-80"
                            />
                            <p className="text-green-500 text-[10px] md:text-xs font-mono text-center">
                                {'// GUARDIAN_PROTOCOL_ACTIVE'}
                            </p>
                        </div>

                        <div className="space-y-2 md:space-y-3">
                            <p className="text-yellow-400 font-bold border-b border-yellow-400/30 pb-1 mb-2 text-xs md:text-sm">
                                AVAILABLE MODULES
                            </p>
                            {CARD_SYNOPSIS_TITLES_DATA.map((title, idx) => {
                                const isActive = activeIndex === idx;
                                return (
                                    <div 
                                        key={idx} 
                                        className={`text-[10px] md:text-xs font-mono cursor-pointer p-1 transition-colors group flex items-center
                                            ${isActive ? 'bg-green-900/50 border-l-2 border-green-400' : 'hover:bg-green-900/30'}
                                        `}
                                        onClick={() => handleCardClick(idx)}
                                        onMouseEnter={() => setHoveredIndex(idx)}
                                        onMouseLeave={() => setHoveredIndex(null)}
                                    >
                                        <span className={`mr-2 ${isActive ? 'text-green-300 font-bold' : 'text-green-600 group-hover:text-green-400'}`}>
                                            {`[0${idx}]`}
                                        </span>
                                        <span className={`${isActive ? 'text-white font-bold' : 'text-gray-300 group-hover:text-white'}`}>
                                            {title.split(':')[0]}
                                        </span>
                                        {isActive && (
                                            <span className="ml-auto text-green-400 animate-pulse">
                                                &lt;&lt;
                                            </span>
                                        )}
                                    </div>
                                );
                            })}
                        </div>

                        <div className="mt-auto pt-4 border-t border-green-800 hidden md:block">
                             <p className="text-[10px] text-gray-500">
                                CLICK A CARD OR MODULE TO INITIALIZE.
                             </p>
                        </div>
                    </div>

                </div>
                
                {/* Status Area */}
                <div className="mt-2 text-sm font-mono text-yellow-400">
                    {message}
                </div>
            </div>
        </>
    );
}
