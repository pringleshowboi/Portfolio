// components/TerminalScreen/TerminalScreen.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns'; 

// 🛑 REQUIRED EXTERNAL COMPONENTS 🛑
import WindowsStartupAudio from '../WindowsStartupAudio/WindowsStartupAudio';
// import CardGame from '../CardGame/CardGame'; // ❌ REMOVED: Game now opens externally
import ChatbotArea from '../ChatbotArea/ChatbotArea'; 
import JarvisAvatar from '../JarvisAvatar/JarvisAvatar'; 

// --- Configuration & Types ---
type AppState = 'idle' | 'booting' | 'os_load' | 'terminal';

const BOOT_MESSAGES = [
    "BIOS v3.14 - Initializing...",
    "CPU: Intel Core Resume Processor",
    "RAM: 64GB Experience",
    "Loading portfolio.sys...",
    "Mounting /dev/skills...",
    "Starting interactive interface...",
    "Ready.",
];

const MESSAGE_DELAY = 350;      // Speed of the boot messages
const OS_LOAD_DURATION = 3500;  // Duration of the Windows sound/animation
const PAUSE_AFTER_READY = 700;  // Pause after 'Ready.' before switching

interface TerminalScreenProps {
    appState: AppState;
    onOsLoadComplete: () => void;
    // UPDATED: Added 'blog.exe' command type
    onTerminalExecute: (command: 'cards.exe' | 'blog.exe') => void; 
}

// Define the ASCII Card Icon
const ASCII_CARD_ICON = `🃜`;
// Define the ASCII Blog Icon (NEW)
const ASCII_BLOG_ICON = `🖥`; 

// ----------------------------------------------------------------------
// HELPER COMPONENT: WORLD AND TIME 
// ----------------------------------------------------------------------

const WorldAndTime = ({ currentTime, currentDate }: { currentTime: string; currentDate: string }) => {

    return (
        <div 
            className="border-2 border-green-400 p-2 flex flex-col justify-center items-center h-full w-full"
            style={{ gridArea: 'world_time' }}
        >
            <div className="flex flex-col items-center justify-start h-full text-green-400 p-1 w-full">
                
                {/* CLOCK DISPLAY */}
                <pre className="text-5xl font-extrabold text-yellow-400 tracking-wider mb-1 leading-none">
                    {currentTime.slice(0, 5)} 
                </pre>
                {/* DATE DISPLAY */}
                <p className="text-1xl mb-2">{currentDate}</p>

                {/* ROTATING WORLD */}
                <div className="flex-grow flex justify-center items-center h-full overflow-hidden">
                    <img 
                        src="/images/globe.gif" 
                        alt="Rotating Globe GIF" 
                        className="w-500 h-12 scale-200 object-contain" 
                    />
                </div>
            </div>
        </div>
    );
}


// ----------------------------------------------------------------------
// HELPER COMPONENT: NESTED GRID WRAPPER FOR RIGHT COLUMN
// ----------------------------------------------------------------------

interface RightColumnWrapperProps { 
    currentTime: string; 
    currentDate: string; 
    status: string; // Dynamic status for the chatbot to display
}

const RightColumnWrapper = ({ currentTime, currentDate, status }: RightColumnWrapperProps) => {
    return (
        <div 
            className="grid h-full w-full gap-4"
            style={{
                // Internal vertical split: 1fr (Time) 2fr (Chatbot)
                gridTemplateRows: '1fr 2fr', 
                gridTemplateAreas: `
                    "world_time"
                    "chatbot"
                `,
            }}
        >
            <WorldAndTime currentTime={currentTime} currentDate={currentDate} />
            {/* Using the external ChatbotArea component */}
            <ChatbotArea currentTime={currentTime} status={status} />
        </div>
    );
}


// ----------------------------------------------------------------------
// MAIN TERMINALSCREEN COMPONENT 
// ----------------------------------------------------------------------

export default function TerminalScreen({ appState, onOsLoadComplete, onTerminalExecute }: TerminalScreenProps) {
    const [messages, setMessages] = useState<string[]>([]);
    const sequenceStartedRef = useRef(false);
    
    // State for time and date
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');

    // Dynamic Status State (Used by RightColumnWrapper -> ChatbotArea)
    const [systemStatus, setSystemStatus] = useState("System Offline");


    // Handler for Cards.exe click
    const handleCardsExecute = () => {
        // This function tells the parent component (App or Layout) to change state
        onTerminalExecute('cards.exe'); 
    };

    // Handler for Blog.exe click (NEW)
    const handleBlogExecute = () => {
        // This function tells the parent component to navigate to the blog page
        onTerminalExecute('blog.exe'); 
    };

    // --- Dynamic Status Effect (Simplified) ---
    useEffect(() => {
        if (appState === 'terminal') {
            setSystemStatus("Active - Awaiting Command");
        } else {
            setSystemStatus("System Initializing...");
        }
    }, [appState]);


    // --- Boot Sequence Logic (Unchanged) ---
    const runBootSequence = useCallback(() => {
        if (sequenceStartedRef.current) return;
        sequenceStartedRef.current = true;
        setMessages([]);

        let currentMessageIndex = 0;
        
        const typeMessage = () => {
            if (currentMessageIndex >= BOOT_MESSAGES.length) {
                setTimeout(() => { onOsLoadComplete(); }, PAUSE_AFTER_READY); // Transition to os_load
                return;
            }
            
            setMessages(prev => [...prev, BOOT_MESSAGES[currentMessageIndex]]);
            currentMessageIndex++;
            
            setTimeout(typeMessage, MESSAGE_DELAY);
        };

        setTimeout(typeMessage, MESSAGE_DELAY);
    }, [onOsLoadComplete]);


    // Effect to start the boot sequence (Unchanged)
    useEffect(() => {
        if (appState === 'booting' && !sequenceStartedRef.current) {
            runBootSequence();
        }
    }, [appState, runBootSequence]);


    // Effect to handle the OS Load duration (Unchanged)
    useEffect(() => {
        let timeout: NodeJS.Timeout;

        if (appState === 'os_load') {
            timeout = setTimeout(() => { 
                onOsLoadComplete(); // Transition to 'terminal' state
            }, OS_LOAD_DURATION);
        }

        return () => clearTimeout(timeout);
    }, [appState, onOsLoadComplete]);


    // Effect for the real-time clock and date display (Unchanged)
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
                <div className="w-full h-full flex flex-col justify-center items-center bg-blue-700 text-white text-3xl font-bold">
                    <WindowsStartupAudio />
                    <p className='animate-pulse'>OS INITIALIZING...</p>
                    <p className='text-sm mt-2'>Loading User Profile...</p>
                </div>
            )}

            {/* 🛑 STATE 3: TERMINAL DESKTOP 🛑 */}
            {appState === 'terminal' && (
                // ✅ SCROLL FIX STEP 1: Use h-full and w-full, and apply p-10 here. Make it a flex container.
                <div className="w-full h-full bg-black/90 pointer-events-auto text-green-400 p-10 flex flex-col">
                    
                    {/* MASTER GRID */}
                    <div 
                        // ✅ SCROLL FIX STEP 2: Change `height: 'calc(100vh - 80px)'` to `h-full` and add `overflow-y-auto`.
                        // h-full works now because the parent div is a constrained flex container.
                        className="grid w-full h-full gap-4 overflow-y-auto"
                        style={{
                            gridTemplateColumns: '2fr 1fr', 
                            gridTemplateRows: '2fr 1fr', 
                            gridTemplateAreas: `
                                "ui right_column"
                                "terminal right_column"
                            `,
                        }}
                    >
                        
                        <div 
                            className="p-4 flex flex-col border-t border-l border-green-400"
                            style={{ 
                                gridArea: 'ui',
                                borderRight: 'none', 
                                borderBottom: 'none' 
                            }}
                        >
                            <p className="text-yellow-400 font-bold mb-2">ACCESS PORT:</p>
                            <p className="text-xs text-green-300">
                                Launch the interactive game, read detailed case studies, or jump straight to services.
                            </p>
                            
                            <div className="flex flex-col items-start space-y-4 pt-4">
                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2"
                                    onClick={handleCardsExecute}
                                >
                                    <pre className="leading-none text-7xl text-green-400 hover:text-white">{ASCII_CARD_ICON}</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">cards.exe</span>
                                        <span className="text-xs text-green-300">
                                            3D portfolio game that reveals key projects and skills.
                                        </span>
                                    </div>
                                </div>

                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2 ml-[-2]"
                                    onClick={handleBlogExecute} 
                                >
                                    <pre className="leading-none text-6xl text-green-400 hover:text-white">{ASCII_BLOG_ICON}</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">blog.exe</span>
                                        <span className="text-xs text-green-300">
                                            Long-form writeups, breakdowns, and technical deep dives.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div 
                            className="border-t-2 border-l-2 border-b-2 border-green-400 px-4 py-3 flex flex-col justify-start text-xs md:text-sm leading-relaxed"
                            style={{ gridArea: 'terminal' }}
                        >
                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                <p className="text-yellow-400 font-bold">C:\SERVICES\WEB_DEV.DASH</p>
                                <p className="text-[10px] md:text-xs text-green-300">
                                    Next.js • Three.js • Tailwind • Sanity • Custom UX
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/2 space-y-2">
                                    <p className="text-green-300 font-semibold tracking-wide">
                                        PORTFOLIO SNAPSHOT
                                    </p>
                                    <p>
                                        This OS-style interface is a custom 3D portfolio built to feel like real software,
                                        not just a scrolling web page.
                                    </p>
                                    <div className="border border-green-700/70 px-3 py-2 rounded-md bg-black/40 space-y-1">
                                        <p className="text-green-300 font-semibold text-xs">HIGHLIGHTED CAPABILITIES</p>
                                        <ul className="list-disc list-inside space-y-1">
                                            <li>Interactive 3D scenes wired into real navigation.</li>
                                            <li>Headless CMS for blogs and content-heavy sections.</li>
                                            <li>Responsive layouts tuned for desktop and mobile.</li>
                                            <li>Fast, smooth experiences with attention to detail.</li>
                                        </ul>
                                    </div>
                                </div>

                                <div className="md:w-1/2 space-y-2">
                                    <p className="text-green-300 font-semibold tracking-wide">
                                        WEBSITE PACKAGES & PRICING
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="border border-green-700/70 px-3 py-2 rounded-md bg-black/40">
                                            <p className="font-semibold text-yellow-300 text-xs uppercase">Launch Pad</p>
                                            <p className="text-green-300 text-xs">From $900</p>
                                            <p className="mt-1">
                                                Clean, modern single-page or small multi-section site to get you live quickly.
                                            </p>
                                        </div>
                                        <div className="border border-green-700/70 px-3 py-2 rounded-md bg-black/40">
                                            <p className="font-semibold text-yellow-300 text-xs uppercase">Growth Ready</p>
                                            <p className="text-green-300 text-xs">From $1,800</p>
                                            <p className="mt-1">
                                                Multi-page marketing site with blog, CMS, and conversion-focused UX for leads.
                                            </p>
                                        </div>
                                        <div className="border border-green-700/70 px-3 py-2 rounded-md bg-black/40">
                                            <p className="font-semibold text-yellow-300 text-xs uppercase">Custom Experience</p>
                                            <p className="text-green-300 text-xs">From $3,000</p>
                                            <p className="mt-1">
                                                Bespoke interactions, animations, and product-like experiences tailored to your brand.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-xs text-green-300">
                                    Ready to talk about a project? Initiate a direct call protocol:
                                </p>
                                <a
                                    href="tel:+270609884544"
                                    className="inline-flex items-center justify-center px-3 py-1.5 text-xs font-semibold rounded-md border border-yellow-400 text-yellow-300 hover:bg-yellow-400 hover:text-black transition-colors"
                                >
                                    CALL TO DISCUSS A WEBSITE
                                </a>
                            </div>
                        </div>


                        {/* 2 & 4. RIGHT COLUMN (Spans both rows, contains nested grid) */}
                        <div style={{ gridArea: 'right_column' }}>
                            <RightColumnWrapper 
                                currentTime={currentTime} 
                                currentDate={currentDate} 
                                status={systemStatus} 
                            />
                        </div>
                        
                    </div>
                </div>
            )}
        </div>
    );
}
