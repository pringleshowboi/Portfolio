// components/TerminalScreen/TerminalScreen.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import WindowsStartupAudio from '../WindowsStartupAudio/WindowsStartupAudio';
import { format } from 'date-fns'; 

// Define AppState to match your page.tsx flow
type AppState = 'idle' | 'zooming' | 'booting' | 'os_load' | 'terminal';

// Configuration for the boot sequence text
const BOOT_MESSAGES = [
    "BIOS v3.14 - Initializing...",
    "CPU: Intel Core Resume Processor",
    "RAM: 64GB Experience",
    "Loading portfolio.sys...",
    "Mounting /dev/skills...",
    "Starting interactive interface...",
    "Ready.",
];

const MESSAGE_DELAY = 350;       // Speed of the boot messages
const OS_LOAD_DURATION = 3500;   // Duration of the Windows sound/animation (e.g., 3.5 seconds)
const PAUSE_AFTER_READY = 700;   // Pause after 'Ready.' before switching

interface TerminalScreenProps {
    appState: AppState;
    onOsLoadComplete: () => void;
    onTerminalExecute: () => void;
}

// Define the ASCII Card Icon
const ASCII_CARD_ICON = `
🃜
`;

// ----------------------------------------------------------------------
// HELPER COMPONENT: WORLD AND TIME 
// ----------------------------------------------------------------------

const WorldAndTime = ({ currentTime, currentDate }: { currentTime: string; currentDate: string }) => {

    return (
        // Added gridArea: 'world_time' to match the new nested grid structure
        <div 
            className="border-2 border-green-400 p-2 flex flex-col justify-center items-center h-full w-full"
            style={{ gridArea: 'world_time' }}
        >
            <div className="flex flex-col items-center justify-start h-full text-green-400 p-1 w-full">
                
                {/* CLOCK DISPLAY */}
                <pre className="text-1xl font-extrabold text-yellow-400 tracking-wider mb-1 leading-none">
                    {currentTime.slice(0, 5)} 
                </pre>
                {/* DATE DISPLAY */}
                <p className="text-1xl mb-2">{currentDate}</p>

                {/* ROTATING WORLD */}
                <div className="flex-grow flex justify-center items-center h-full overflow-hidden">
                    <img 
                        src="/images/globe.gif" 
                        alt="Rotating Globe GIF" 
                        className="w-500 h-9 scale-100 object-contain" 
                    />
                </div>
            </div>
        </div>
    );
}

// ----------------------------------------------------------------------
// HELPER COMPONENT: CHATBOT AREA 
// ----------------------------------------------------------------------

const ChatbotArea = ({ currentTime }: { currentTime: string }) => {
    return (
        // Added gridArea: 'chatbot' to match the new nested grid structure
        <div 
            className="border-2 border-green-400 p-2 flex flex-col justify-end h-full w-full"
            style={{ gridArea: 'chatbot' }}
        >
            <p className="text-yellow-400 font-bold mb-2">J.A.R.V.I.S. INTERFACE:</p>
            
            {/* This div uses flex-grow to occupy most of the available height, now 2/3 of the right column */}
            <div className="flex-grow flex justify-center items-center h-full bg-black/50">
                <p className="text-xl text-gray-500 font-bold">
                    [TALL JARVIS AVATAR AREA]
                </p>
            </div>

            <div className="flex justify-between items-center text-sm mt-2">
                <p className="text-yellow-400 font-bold">STATUS:</p>
                <p className="text-sm">[ACTIVE]</p>
            </div>
            <p className="text-xs mt-1 text-right">LAST PING: {currentTime.slice(0, 5)}</p>
        </div>
    );
}

// ----------------------------------------------------------------------
// NESTED GRID WRAPPER FOR RIGHT COLUMN (FOR 1/3 and 2/3 SPLIT)
// ----------------------------------------------------------------------

const RightColumnWrapper = ({ currentTime, currentDate }: { currentTime: string, currentDate: string }) => {
    return (
        // This container occupies the entire right column area defined by the main grid
        <div 
            className="grid h-full w-full gap-4"
            style={{
                // This defines the internal vertical split: 1fr (Time) 2fr (Chatbot)
                gridTemplateRows: '1fr 2fr', 
                gridTemplateAreas: `
                    "world_time"
                    "chatbot"
                `,
            }}
        >
            <WorldAndTime currentTime={currentTime} currentDate={currentDate} />
            <ChatbotArea currentTime={currentTime} />
        </div>
    );
}


// ----------------------------------------------------------------------
// MAIN COMPONENT 
// ----------------------------------------------------------------------

export default function TerminalScreen({ appState, onOsLoadComplete, onTerminalExecute }: TerminalScreenProps) {
    const [messages, setMessages] = useState<string[]>([]);
    const sequenceStartedRef = useRef(false);
    
    // State for time and date
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    // Function to run the sequential boot messages
    const runBootSequence = useCallback(() => {
        if (sequenceStartedRef.current) return;
        sequenceStartedRef.current = true;
        setMessages([]);

        let currentMessageIndex = 0;
        
        const typeMessage = () => {
            if (currentMessageIndex >= BOOT_MESSAGES.length) {
                setTimeout(() => { onOsLoadComplete(); }, PAUSE_AFTER_READY);
                return;
            }
            
            setMessages(prev => [...prev, BOOT_MESSAGES[currentMessageIndex]]);
            currentMessageIndex++;
            
            setTimeout(typeMessage, MESSAGE_DELAY);
        };

        setTimeout(typeMessage, MESSAGE_DELAY);
    }, [onOsLoadComplete]);


    // Effect to start the boot sequence
    useEffect(() => {
        if (appState === 'booting' && !sequenceStartedRef.current) {
            runBootSequence();
        }
    }, [appState, runBootSequence]);


    // Effect to handle the OS Load animation/sound duration
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (appState === 'os_load') {
            timeout = setTimeout(() => { onOsLoadComplete(); }, OS_LOAD_DURATION);
        }

        return () => clearTimeout(timeout);
    }, [appState, onOsLoadComplete]);


    // Effect for the real-time clock and date display
    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (appState === 'terminal') {
            const updateDateTime = () => {
                const now = new Date();
                setCurrentTime(format(now, 'HH:mm:ss')); 
                setCurrentDate(format(now, 'dd-MM-yyyy'));
            };
            updateDateTime(); 
            interval = setInterval(updateDateTime, 1000); 
        }
        return () => clearInterval(interval);
    }, [appState]);


    // Helper for the blinking cursor logic
    const isBootingActive = appState === 'booting' && sequenceStartedRef.current && messages.length < BOOT_MESSAGES.length;

    return (
        <div className={`absolute inset-0 z-10 font-mono flex flex-col justify-start items-start pointer-events-none`}> 
            
            {/* 🛑 STATE 1: BOOTING (TEXT MESSAGES) 🛑 */}
            {appState === 'booting' && (
                <div className="w-full h-full p-10 text-green-400 bg-black/90">
                    {messages.map((msg, index) => (
                        <p key={index} className="mb-1">{msg}</p>
                    ))}
                    {isBootingActive && <span className="animate-pulse">_</span>}
                </div>
            )}
            
            {/* 🛑 STATE 2: OS LOAD (TRANSITION SCREEN) 🛑 */}
            {appState === 'os_load' && (
                // Keep the blue screen briefly as a transition element
                <div className="w-full h-full flex flex-col justify-center items-center bg-blue-700 text-white text-3xl font-bold">
                    <WindowsStartupAudio />
                    <p className='animate-pulse'>OS INITIALIZING...</p>
                    <p className='text-sm mt-2'>Loading User Profile...</p>
                </div>
            )}

            {/* 🛑 STATE 3: TERMINAL DESKTOP 🛑 */}
            {appState === 'terminal' && (
                <div className="w-full h-full p-10 bg-black/90 pointer-events-auto text-green-400">
                    
                    {/* MASTER GRID */}
                    <div 
                        className="grid h-full w-full gap-4"
                        style={{
                            gridTemplateColumns: '2fr 1fr', // Left 2/3, Right 1/3
                            // Row split for the left column: 2fr (UI) 1fr (Terminal)
                            gridTemplateRows: '2fr 1fr', 
                            gridTemplateAreas: `
                                "ui right_column"
                                "terminal right_column"
                            `,
                        }}
                    >
                        
                        {/* 1. UI AREA (Top Left - Tall) */}
                        <div 
                            className="p-4 flex flex-col border-t border-l border-green-400"
                            style={{ 
                                gridArea: 'ui',
                                borderRight: 'none', 
                                borderBottom: 'none' 
                            }}
                        >
                            <p className="text-yellow-400 font-bold mb-6">ACCESS PORT:</p>
                            
                            {/* Icons/Menu */}
                            <div className="flex flex-col items-start space-y-4 pt-4">
                                
                                {/* Cards.exe Icon (ASCII ICON) - Clickable */}
                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2"
                                    onClick={onTerminalExecute}
                                >
                                    <pre className="leading-none text-7xl text-green-400 hover:text-white">{ASCII_CARD_ICON}</pre>
                                    <span className="mt-30">cards.exe</span>
                                </div>
                            </div>
                        </div>
                        
                        {/* 3. TERMINAL AREA (Bottom Left - Short) */}
                        <div 
                            className="border-t-2 border-l-2 border-b-2 border-green-400 p-2 overflow-y-auto flex flex-col justify-start"
                            style={{ gridArea: 'terminal' }}
                        >
                            <p className="text-yellow-400 font-bold mb-1">C:\USERS\PORTFOLIO\TERMINAL_LOG.txt</p>
                            
                            {/* Placeholder content */}
                            <p className="text-xs">LOG: System integrity check complete. OK.</p>
                            <p className="text-xs">LOG: Initiating network probe sequence...</p>
                            <p className="text-xs">LOG: Encryption protocols fully engaged.</p>
                            <p className="text-xs">LOG: System is now accepting commands.</p>
                            
                            {/* Terminal command line */}
                            <p className="mt-2 text-white font-bold">C:\USERS\PORTFOLIO\&gt; <span className="animate-pulse">_</span></p>
                            {/* Future API Hook: This area will host the logic for your terminal API interaction. */}
                        </div>


                        {/* 2 & 4. RIGHT COLUMN (Spans both rows, contains nested grid) */}
                        <div style={{ gridArea: 'right_column' }}>
                            <RightColumnWrapper currentTime={currentTime} currentDate={currentDate} />
                        </div>
                        
                    </div>
                </div>
            )}
        </div>
    );
}