'use client';

import { useState, useCallback, useLayoutEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber'; 
import { Environment } from '@react-three/drei'; 
import * as THREE from 'three';
import CardDisplay from './CardDisplay'; 
import Link from 'next/link'; 
import { useRouter } from 'next/navigation';

// --- Configuration ---
const CARD_SYNOPSIS_TITLES_DATA = [
    'DATA SERVICES: KING OF CLUBS', 
    'AUTOMATION: QUEEN OF CLUBS', 
    'THE GAPS: JACK OF HEARTS', 
    'CLOUD & INFRA: ACE OF SPADES', 
    'FUTURE TECH: TEN OF HEARTS'
];

// Mapping of card index to redirect URLs
const CARD_URLS = [
    '/services/data-services',       // 0
    '/services/automation',          // 1
    '/services/web-strategy',        // 2
    '/services/cloud-infrastructure',// 3
    '/services/emerging-tech'        // 4
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

// --- STATIC CAMERA ---
function StaticCamera() {
    const { camera, size, invalidate } = useThree(); 
    
    const updateCamera = useCallback(() => {
        const fixedPosition: [number, number, number] = [0, 0, 5]; 
        const fixedTarget: [number, number, number] = [0, 0, 0];
        const frustumSize = 7; 
        const fixedZoom = 1.8; 

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


export default function CardGame({ onExit }: CardGameProps) {
    const router = useRouter();
    const [message, setMessage] = useState("SELECT A SERVICE CARD TO NAVIGATE");

    const handleCardClick = useCallback((index: number) => {
        const url = CARD_URLS[index];
        if (url) {
            setMessage(`REDIRECTING TO ${CARD_SYNOPSIS_TITLES_DATA[index]}...`);
            router.push(url);
        }
    }, [router]);


    return (
        <> 
            <div className="flex flex-col h-full w-full p-2 bg-black relative">
                <div className="flex justify-between items-center mb-2 pb-2 border-b border-green-700">
                    <h2 className="text-xl text-yellow-400 font-bold">SERVICE CATALOG: services.exe</h2>
                    <div className="flex space-x-2"> 
                        <Link 
                            href="/cv/OWEN-VAN-WYK-RESUME.pdf"
                            download 
                            className="px-3 py-1 text-sm transition-colors font-bold text-white bg-green-600 hover:bg-green-400 border border-green-600"
                        >
                            [💾] DOWNLOAD PROFILE
                        </Link>
                        <button 
                            onClick={onExit} 
                            className="px-3 py-1 text-sm text-white bg-red-600 hover:bg-red-400 border border-red-600 transition-colors font-bold"
                        >
                            [X] EXIT TO TERMINAL
                        </button>
                    </div>
                </div>

                <div className="flex-1 relative border border-green-700 bg-gray-900 overflow-hidden flex">
                    
                    {/* LEFT SIDE: 3D CARDS */}
                    <div className="flex-1 h-full relative z-10">
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
                            <StaticCamera />
                            <ambientLight intensity={0.5} />
                            <directionalLight position={[10, 10, 5]} intensity={1} />
                            <Environment preset="night" />

                            {/* Renders cards in hand */}
                            {HAND_POSITIONS.map((pos, index) => (
                                <InteractiveCard
                                    key={index}
                                    index={index}
                                    onCardClick={handleCardClick}
                                    position={pos}
                                    cardRotationZ={CARD_ROTATIONS_Z[index]}
                                />
                            ))}
                        </Canvas>
                    </div>

                    {/* RIGHT SIDE: LADY JUSTICE & SERVICE LIST */}
                    <div className="w-1/3 h-full border-l border-green-800 bg-black/80 flex flex-col p-4 z-20 overflow-y-auto">
                        
                        <div className="flex flex-col items-center mb-6">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img 
                                src="/images/lady-justice.png" 
                                alt="Lady Justice" 
                                className="w-40 h-40 object-contain mb-2 opacity-80"
                            />
                            <p className="text-green-500 text-xs font-mono text-center">
                                {'// GUARDIAN_PROTOCOL_ACTIVE'}
                            </p>
                        </div>

                        <div className="space-y-3">
                            <p className="text-yellow-400 font-bold border-b border-yellow-400/30 pb-1 mb-2">
                                AVAILABLE MODULES
                            </p>
                            {CARD_SYNOPSIS_TITLES_DATA.map((title, idx) => (
                                <div 
                                    key={idx} 
                                    className="text-xs font-mono cursor-pointer hover:bg-green-900/30 p-1 transition-colors group"
                                    onClick={() => handleCardClick(idx)}
                                >
                                    <span className="text-green-600 mr-2 group-hover:text-green-400">{`[0${idx}]`}</span>
                                    <span className="text-gray-300 group-hover:text-white">{title.split(':')[0]}</span>
                                </div>
                            ))}
                        </div>

                        <div className="mt-auto pt-4 border-t border-green-800">
                             <p className="text-[10px] text-gray-500">
                                SELECT A CARD OR MODULE TO INITIALIZE SERVICE REDIRECT.
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
