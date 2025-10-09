// app/page.tsx
'use client';

// Import all necessary components and hooks
import SystemStartup from "./components/SystemStartup/SystemStartup";
import BackgroundAudio from "./components/BackgroundAudio/BackgroundAudio"
import { useState, useRef, useCallback, useEffect } from "react"; 
import CardGame from "./components/CardGame/CardGame"; 
import { useRouter } from 'next/navigation'; 

// --- Configuration for Audio Fade-in ---
const TARGET_VOLUME = 0.4;      // Final volume (40%)
const FADE_DURATION = 1500;     // Fade over 1.5 seconds (1500ms)
const REDIRECT_DELAY_MS = 1500; // Delay after game completion before redirecting
// ----------------------------------------

// COMPLETE STATE TYPE
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal' | 'game' | 'game_complete';
// CARD CONFIG
const CARD_COUNT = 5;

const Home = () => {
    const router = useRouter(); 
    const [appState, setAppState] = useState<AppState>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const [collectedCards, setCollectedCards] = useState<boolean[]>(Array(CARD_COUNT).fill(false));


    // Function to handle the smooth fade-in of the background audio
    const startAudioFade = () => {
        const audio = audioRef.current;
        if (audio) {
            audio.play().catch(error => { console.error("Audio failed to play:", error); });
            let volume = 0;
            const interval = 50;
            const steps = FADE_DURATION / interval;
            const volumeStep = TARGET_VOLUME / steps;
            const fadeInterval = setInterval(() => {
                volume += volumeStep;
                if (audio) audio.volume = Math.min(volume, TARGET_VOLUME);
                if (volume >= TARGET_VOLUME) clearInterval(fadeInterval);
            }, interval);
        }
    };

    // 1. HANDLER: Triggered when the 3D monitor mesh is clicked (idle -> zooming)
    const handleScreenClick = () => {
        if (appState === 'idle') {
            startAudioFade();
            setAppState('zooming');
        }
    };

    // 2. HANDLER: Triggered when CameraZoom animation finishes (zooming -> booting)
    const handleZoomComplete = () => {
        if (appState === 'zooming') {
            setAppState('booting');
        }
    };

    // 3. HANDLER: Triggered twice by TerminalScreen (booting -> os_load -> terminal)
    const handleOsLoadComplete = () => {
        if (appState === 'booting') {
            setAppState('os_load');
        } else if (appState === 'os_load') {
            setAppState('terminal');
        }
    };
    
    // 4. HANDLER: Triggered when the user clicks 'cards.exe' OR 'blog.exe'
    // 🛑 FIX APPLIED HERE 🛑
    const handleTerminalExecute = (command: 'cards.exe' | 'blog.exe') => {
        if (command === 'cards.exe') {
            setAppState('game'); // Launch the card game
        } else if (command === 'blog.exe') {
            // Immediately redirect to the blog page when 'blog.exe' is clicked
            router.push('/blog'); 
        }
    };
    
    // 5. HANDLER: Exit the game back to the terminal
    const handleExitGame = () => {
        setAppState('terminal');
    };

    // 6. HANDLER: Card Collection Logic
    const handleCardCollect = useCallback((index: number) => {
        setCollectedCards(prev => {
            const newCards = [...prev];
            newCards[index] = true;
            
            // CHECK FOR GAME COMPLETION HERE 
            const allCollected = newCards.every(isCollected => isCollected);
            
            if (allCollected) {
                // If all cards are collected, transition to the completion state
                setAppState('game_complete');
            }
            
            return newCards;
        });
    }, []);

    // NEW EFFECT: Redirection Logic for Game Completion
    useEffect(() => {
        let timeout: NodeJS.Timeout;
        
        if (appState === 'game_complete') {
            // Wait a moment for any final game state or message to display
            timeout = setTimeout(() => {
                // Use the router to navigate to the blog page
                router.push('/blog'); 
            }, REDIRECT_DELAY_MS);
        }

        return () => clearTimeout(timeout);
    }, [appState, router]);


    // --- CONDITIONAL RENDERING ---

    return (
        <div className="h-screen w-screen overflow-hidden">
            <BackgroundAudio audioRef={audioRef} />

            {/* RENDER CINEMATIC INTRO / TERMINAL (All non-game states) */}
            {(appState !== 'game' && appState !== 'game_complete') && ( 
                <SystemStartup 
                    appState={appState} 
                    onScreenClick={handleScreenClick}
                    onOsLoadComplete={handleOsLoadComplete} 
                    onTerminalExecute={handleTerminalExecute}
                    onZoomComplete={handleZoomComplete} 
                />
            )}

            {/* RENDER MAIN GAME SCENE */}
            {appState === 'game' && (
                <CardGame
                    collectedCards={collectedCards}
                    onCardCollect={handleCardCollect}
                    onExit={handleExitGame}
                />
            )}
            
            {/* GAME COMPLETE MESSAGE (Briefly Shown before Redirect) */}
            {appState === 'game_complete' && (
                <div className="absolute inset-0 z-50 flex flex-col justify-center items-center bg-black/90 font-mono text-center">
                    <p className="text-4xl font-bold text-green-400 animate-pulse mb-4">
                        DATA RETRIEVAL COMPLETE.
                    </p>
                    <p className="text-xl text-yellow-400">
                        Redirecting to //BLOGSITE.EXE...
                    </p>
                </div>
            )}
            
            {/* Overlay Text for Idle State */}
            {appState === 'idle' && (
                <div className="absolute inset-0 z-20 flex justify-center items-center pointer-events-none">
                    <p className="text-xl md:text-2xl font-mono text-white animate-pulse">
                        CLICK COMPUTER MONITOR TO INITIATE
                    </p>
                </div>
            )}
        </div>
    )
}

export default Home;