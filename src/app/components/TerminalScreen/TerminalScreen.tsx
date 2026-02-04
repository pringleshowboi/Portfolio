// components/TerminalScreen/TerminalScreen.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns'; 

import Image from 'next/image';

// 🛑 REQUIRED EXTERNAL COMPONENTS 🛑
import WindowsStartupAudio from '../WindowsStartupAudio/WindowsStartupAudio';
// import CardGame from '../CardGame/CardGame'; // ❌ REMOVED: Game now opens externally
import ChatbotArea from '../ChatbotArea/ChatbotArea'; 
// import JarvisAvatar from '../JarvisAvatar/JarvisAvatar'; 

// --- Configuration & Types ---
type AppState = 'idle' | 'booting' | 'os_load' | 'terminal';

const BOOT_MESSAGES = [
    "BIOS v3.14 - Initializing...",
    "CPU: Intel Core Resume Processor",
    "RAM: 64GB Experience",
    "Loading secure_core.sys...",
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
        >
            <div className="flex flex-col items-center justify-start h-full text-green-400 p-1 w-full">
                
                {/* CLOCK DISPLAY */}
                <pre className="text-5xl font-extrabold text-yellow-400 tracking-wider mb-1 leading-none">
                    {currentTime.slice(0, 5)} 
                </pre>
                {/* DATE DISPLAY */}
                <p className="text-1xl mb-2">{currentDate}</p>

                {/* ROTATING WORLD */}
                <div className="flex-grow flex justify-center items-center h-full overflow-hidden relative">
                    <div className="w-500 h-12 scale-200 relative">
                        <Image 
                            src="/images/globe.gif" 
                            alt="Rotating Globe GIF" 
                            fill
                            className="object-contain" 
                            unoptimized
                        />
                    </div>
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
        <div className="flex flex-col h-full w-full gap-4">
            {/* Top Section: World & Time - Fixed height on mobile, fraction on desktop */}
            <div className="flex-none h-40 lg:h-[30%] w-full">
                <WorldAndTime currentTime={currentTime} currentDate={currentDate} />
            </div>
            {/* Bottom Section: Chatbot - Fills remaining space */}
            <div className="flex-1 min-h-0 w-full">
                <ChatbotArea currentTime={currentTime} status={status} />
            </div>
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
                <div className="w-full h-full bg-black/90 pointer-events-auto text-green-400 px-6 py-4 md:px-10 md:py-6 flex flex-col">
                    
                    <div className="flex flex-col lg:grid lg:grid-cols-3 lg:grid-rows-[2fr_1fr] w-full h-full gap-4 overflow-y-auto lg:overflow-hidden pr-1 lg:pr-0">
                        
                        <div 
                            className="p-4 flex flex-col border-t border-l border-green-400 lg:col-span-2 lg:row-span-1"
                            style={{ 
                                borderRight: 'none', 
                                borderBottom: 'none' 
                            }}
                        >
                            <p className="text-yellow-400 font-bold mb-2">ACCESS PORT:</p>
                            <p className="text-xs text-green-300">
                                Launch the interactive services deck, read detailed breakdowns, or jump straight to solutions.
                            </p>
                            
                            <div className="flex flex-col items-start space-y-4 pt-4">
                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2"
                                    onClick={handleCardsExecute}
                                >
                                    <pre className="leading-none text-7xl text-green-400 hover:text-white">{ASCII_CARD_ICON}</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">services.exe</span>
                                        <span className="text-xs text-green-300">
                                            3D interactive deck revealing our capabilities and specialized services.
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
                            className="border-t-2 border-l-2 border-b-2 border-green-400 px-4 py-3 flex flex-col justify-start text-xs md:text-sm leading-relaxed lg:col-span-2 lg:row-span-1"
                        >
                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                <p className="text-yellow-400 font-bold tracking-widest">WEB_DEV.DASH</p>
                                <p className="text-[10px] md:text-xs text-green-300 font-mono opacity-80">
                                    Next.js • Three.js • Tailwind • Sanity • Custom UX
                                </p>
                            </div>

                            <div className="flex flex-col md:flex-row gap-6">
                                <div className="md:w-1/2 space-y-3">
                                    <div className="border-l-2 border-green-700 pl-3">
                                        <p className="text-green-300 font-semibold tracking-wide text-xs mb-1">
                                            {'// SYSTEM SNAPSHOT'}
                                        </p>
                                        <p className="text-gray-300 leading-relaxed">
                                            Unlike Tier 3 agencies (Ruby Digital, CreativeWeb) that often rely on standard templates, 
                                            we build custom, secure-first environments tailored for high-impact brand differentiation.
                                        </p>
                                    </div>

                                    <div className="bg-green-900/10 border border-green-800 p-3 rounded-sm space-y-2">
                                        <p className="text-green-400 font-bold text-xs uppercase tracking-wider border-b border-green-800 pb-1 mb-1">
                                            OUR EDGE (THE &quot;GAPS&quot;)
                                        </p>
                                        <div className="grid grid-cols-1 gap-2 text-xs">
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Security Gap</span>
                                                <span className="text-green-300 font-mono">&quot;Cyber-Secure Dev&quot; vs. vulnerable sites.</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Price Gap</span>
                                                <span className="text-green-300 font-mono">&quot;Affordable Specialist&quot; vs. R30k+ giants.</span>
                                            </div>
                                            <div className="flex justify-between items-center">
                                                <span className="text-gray-400">Silo Gap</span>
                                                <span className="text-green-300 font-mono">SEO + Design + Cyber &quot;All-in-One&quot;.</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="md:w-1/2 space-y-3">
                                    <p className="text-green-300 font-semibold tracking-wide text-xs">
                                        {'// ENGAGEMENT MODELS'}
                                    </p>
                                    <div className="grid grid-cols-1 gap-2">
                                        <div className="group border border-green-800 hover:border-green-500 bg-black/40 p-3 transition-colors duration-300 cursor-default">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-bold text-yellow-400 text-xs tracking-wider">Fixed-Price Pilot</p>
                                                <span className="text-[10px] bg-green-900/50 px-1 text-green-300 rounded">$3,000 (One-Time)</span>
                                            </div>
                                            <p className="text-gray-400 text-xs mb-1">Initial site build, security hardening, and SEO foundation. The &quot;Digital Launchpad&quot;.</p>
                                        </div>

                                        <div className="group border border-green-800 hover:border-green-500 bg-black/40 p-3 transition-colors duration-300 cursor-default">
                                            <div className="flex justify-between items-center mb-1">
                                                <p className="font-bold text-yellow-400 text-xs tracking-wider">Guardian Retainer</p>
                                                <span className="text-[10px] bg-green-900/50 px-1 text-green-300 rounded">Monthly Subscription</span>
                                            </div>
                                            <p className="text-gray-400 text-xs mb-1">Ongoing maintenance, security monitoring, and minor SEO updates.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-green-900/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                                <p className="text-[10px] text-green-500 font-mono">
                                    Ready to talk about a project? Initiate a direct call protocol:
                                </p>
                                <a
                                    href="tel:+270609884544"
                                    className="inline-flex items-center justify-center px-4 py-1.5 text-xs font-bold tracking-widest uppercase rounded-sm bg-yellow-500/10 border border-yellow-500 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-all duration-300"
                                >
                                    CALL TO DISCUSS A WEBSITE
                                </a>
                            </div>
                        </div>


                        {/* 2 & 4. RIGHT COLUMN (Spans both rows, contains nested grid) */}
                        <div className="lg:col-span-1 lg:row-span-2 lg:col-start-3 lg:row-start-1 h-full">
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
