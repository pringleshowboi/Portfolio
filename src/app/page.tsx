'use client';

// Import all necessary components and hooks
import SystemStartup from "./components/SystemStartup/SystemStartup";
import BackgroundAudio from "./components/BackgroundAudio/BackgroundAudio"
import { useState, useRef } from "react"; 
import CardGame from "./components/CardGame/CardGame"; 
import { useRouter } from 'next/navigation'; 

// --- Configuration for Audio Fade-in ---
const TARGET_VOLUME = 0.4;      // Final volume (40%)
const FADE_DURATION = 1500;     // Fade over 1.5 seconds (1500ms)
// ----------------------------------------

// COMPLETE STATE TYPE
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal' | 'game';

const Home = () => {
    const router = useRouter(); 
    const [appState, setAppState] = useState<AppState>('idle');
    const audioRef = useRef<HTMLAudioElement | null>(null);


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
    const handleTerminalExecute = (command?: 'cards.exe' | 'blog.exe') => {
        if (!command) {
            console.error("handleTerminalExecute called without a command.");
            return;
        }

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


    // --- CONDITIONAL RENDERING ---

    return (
        <div className="h-screen w-screen overflow-hidden">
            <BackgroundAudio audioRef={audioRef} />

            {/* RENDER CINEMATIC INTRO / TERMINAL (All non-game states) */}
            {(appState !== 'game') && ( 
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
                    onExit={handleExitGame}
                />
            )}
            
            {appState === 'idle' && (
                <div className="absolute inset-0 z-20 flex justify-center items-center pointer-events-none">
                    <div className="flex flex-col items-center gap-2 text-center px-4">
                        <p className="text-xl md:text-2xl font-mono text-white animate-pulse">
                            CLICK THE MONITOR TO INITIALIZE SYSTEM
                        </p>
                        <p className="text-sm md:text-base font-mono text-gray-200 max-w-xl">
                            Explore secure services, engagement models, and digital capabilities.
                        </p>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home;
