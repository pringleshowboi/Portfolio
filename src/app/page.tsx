'use client';

// Import all necessary components and hooks
import SystemStartup from "./components/SystemStartup/SystemStartup";
import BackgroundAudio from "./components/BackgroundAudio/BackgroundAudio"
import { useState, useRef } from "react"; 
import CardGame from "./components/CardGame/CardGame"; 
import { useRouter } from 'next/navigation';

// --- Configuration for Audio Fade-in ---
const TARGET_VOLUME = 0.1;      // Final volume (40%)
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
                <div className="absolute inset-0 z-20 flex flex-col justify-center items-center pointer-events-none p-4">
                    {/* Full monitor hit target: matches 3D CRT so clicks anywhere on the bezel/screen start boot */}
                    <button
                        type="button"
                        onClick={handleScreenClick}
                        aria-label="Initialize system — click monitor"
                        className="pointer-events-auto absolute left-1/2 top-[40%] md:top-[38%] -translate-x-1/2 -translate-y-1/2 w-[min(92vw,480px)] h-[min(42vh,320px)] md:h-[min(38vh,300px)] cursor-pointer rounded-md border-2 border-transparent hover:border-green-500/40 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-400/80 bg-transparent"
                    />
                    <div className="flex flex-col items-center gap-6 text-center max-w-4xl w-full pointer-events-none">
                        {/* Top Section - Header */}
                        <div className="flex flex-col gap-2 text-left self-start">
                            <h1 className="text-3xl md:text-5xl font-extrabold font-mono text-white tracking-tighter leading-none animate-glow drop-shadow-[0_2px_8px_rgba(0,0,0,0.85)]">
                                I design and build secure, intelligent systems that scale &mdash; and defend them.
                            </h1>
                            <p className="text-sm md:text-base font-mono text-green-400 opacity-95 uppercase tracking-[0.4em] drop-shadow-[0_1px_4px_rgba(0,0,0,0.9)]">
                                Cybersecurity Architecture &middot; AI Automation &middot; Enterprise Security Engineering
                            </p>
                        </div>

                        {/* Spacer aligns with monitor in scene */}
                        <div className="w-full max-w-md aspect-video min-h-[min(36vh,260px)]" aria-hidden />

                        {/* Bottom Section - Call to Action */}
                        <div className="flex flex-col items-center gap-2">
                            <p className="text-xl md:text-2xl font-mono text-white animate-pulse drop-shadow-[0_2px_6px_rgba(0,0,0,0.9)]">
                                CLICK THE MONITOR TO INITIALIZE SYSTEM
                            </p>
                            <p className="text-xs md:text-sm font-mono text-gray-200 max-w-xl uppercase tracking-widest drop-shadow-[0_1px_4px_rgba(0,0,0,0.95)]">
                                Explore secure services, engagement models, and digital capabilities.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Home;
