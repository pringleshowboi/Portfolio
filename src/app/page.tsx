// app/page.tsx
'use client';

// Import all necessary components and hooks
import SystemStartup from "./components/SystemStartup/SystemStartup";
import BackgroundAudio from "./components/BackgroundAudio/BackgroundAudio";
import { useState, useRef } from "react";
// WindowsStartupAudio is imported and used within TerminalScreen.tsx

// --- Configuration for Audio Fade-in ---
const TARGET_VOLUME = 0.4;      // Final volume (40%)
const FADE_DURATION = 1500;     // Fade over 1.5 seconds (1500ms)
// ----------------------------------------

// 🛑 COMPLETE STATE TYPE 🛑
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal' | 'game';

const Home = () => {
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
            // Text messages finished, start OS animation
            setAppState('os_load');
        } else if (appState === 'os_load') {
            // OS animation finished, show command prompt
            setAppState('terminal');
        }
    };
    
    // 4. HANDLER: Triggered when the user clicks 'cards.exe' (terminal -> game)
    const handleTerminalExecute = () => {
        setAppState('game');
    };

    // --- CONDITIONAL RENDERING ---

    return (
        <>
            <BackgroundAudio audioRef={audioRef} />

            {/* RENDER CINEMATIC INTRO (All non-game states) */}
            {(appState !== 'game') && (
                <SystemStartup 
                    appState={appState} 
                    onScreenClick={handleScreenClick}
                    onOsLoadComplete={handleOsLoadComplete} 
                    onTerminalExecute={handleTerminalExecute}
                    onZoomComplete={handleZoomComplete} // New handler for the CameraZoom component
                />
            )}

            {/* RENDER MAIN GAME SCENE */}
            {appState === 'game' && (
                <div className="text-white h-screen w-screen flex justify-center items-center bg-black">
                    <p className="text-3xl font-bold font-mono">
                        [CARDS.EXE RUNNING: POKER GAME SCENE]
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
        </>
    )
}

export default Home;