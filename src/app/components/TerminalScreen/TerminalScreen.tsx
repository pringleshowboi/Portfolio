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
import ContactModal from '../ContactForm/ContactModal';
import RiskScanModal from '../RiskScan/RiskScanModal';

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
// Define the ASCII Contact Icon (NEW)
const ASCII_CONTACT_ICON = `✉`;

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
    
    // Contact Modal State
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    
    // Risk Scan Modal State
    const [isRiskScanModalOpen, setIsRiskScanModalOpen] = useState(false);


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

    // Handler for Contact.exe click (NEW)
    const handleContactExecute = () => {
        setIsContactModalOpen(true);
    };

    // Handler for Risk Scan (NEW)
    const handleRiskScanExecute = () => {
        setIsRiskScanModalOpen(true);
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
                <div className="w-full h-full bg-black/90 bg-grid-pattern pointer-events-auto text-green-400 px-6 py-4 md:px-10 md:py-6 flex flex-col relative overflow-hidden">
                    {/* Background faint glow for depth */}
                    <div className="absolute inset-0 bg-green-900/5 pointer-events-none z-0" />
                    
                    <div className="flex flex-col lg:grid lg:grid-cols-3 w-full h-full gap-4 overflow-y-auto lg:overflow-hidden pr-1 lg:pr-0 relative z-10">
                        
                        {/* LEFT COLUMN: SECURE DASH (Merged Access Port) */}
                        <div className="flex flex-col gap-4 lg:col-span-2 h-full overflow-y-auto pr-2">
                            
                            {/* SECURE_FIRST.DASH */}
                            <div 
                                className="border-t-2 border-l-2 border-b-2 border-green-400/80 box-glow px-4 py-3 flex flex-col justify-start text-xs md:text-sm leading-relaxed flex-grow bg-black/60 backdrop-blur-sm"
                            >
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4 border-b border-green-800/50 pb-2">
                                    <div>
                                        <h1 className="text-yellow-400 font-bold tracking-widest text-lg md:text-xl text-glow">DEV_ARCHITECT.DASH</h1>
                                        <h2 className="text-[10px] md:text-xs text-green-300 font-mono opacity-80 font-normal">
                                            Full-Stack • UI/UX • Systems
                                        </h2>
                                    </div>

                                    {/* ACCESS PORT (Merged) */}
                                    <div className="flex flex-wrap justify-start md:justify-end gap-3">
                                        <button 
                                            onClick={handleCardsExecute}
                                            className="flex items-center gap-1 text-[10px] hover:text-white transition-all group border border-green-800 px-2 py-1 bg-black/40 hover:bg-green-900/30 hover:border-green-500 hover:box-glow"
                                            title="Services"
                                        >
                                            <span className="text-sm group-hover:scale-110 transition-transform">{ASCII_CARD_ICON}</span>
                                            <span className="hidden sm:inline">SERVICES</span>
                                        </button>

                                        <button 
                                            onClick={handleBlogExecute}
                                            className="flex items-center gap-1 text-[10px] hover:text-white transition-all group border border-green-800 px-2 py-1 bg-black/40 hover:bg-green-900/30 hover:border-green-500 hover:box-glow"
                                            title="Intel"
                                        >
                                            <span className="text-sm group-hover:scale-110 transition-transform">{ASCII_BLOG_ICON}</span>
                                            <span className="hidden sm:inline">INTEL</span>
                                        </button>

                                        <button 
                                            onClick={handleRiskScanExecute}
                                            className="flex items-center gap-1 text-[10px] hover:text-white transition-all group border border-green-800 px-2 py-1 bg-black/40 hover:bg-green-900/30 hover:border-green-500 hover:box-glow"
                                            title="Audit"
                                        >
                                            <span className="text-sm group-hover:scale-110 transition-transform">{ASCII_CONTACT_ICON}</span>
                                            <span className="hidden sm:inline">AUDIT</span>
                                        </button>

                                        <button 
                                            onClick={handleContactExecute}
                                            className="flex items-center gap-1 text-[10px] hover:text-white transition-all group border border-green-800 px-2 py-1 bg-black/40 hover:bg-green-900/30 hover:border-green-500 hover:box-glow"
                                            title="Checklist"
                                        >
                                            <span className="text-sm group-hover:scale-110 transition-transform">🗎</span>
                                            <span className="hidden sm:inline">CHECKLIST</span>
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-6">
                                    <div className="space-y-4">
                                        <div className="border-l-2 border-green-500 pl-4 py-1">
                                            <h3 className="text-green-300 font-semibold tracking-wide text-xs mb-1 uppercase text-glow">
                                                {'// MISSION BRIEFING'}
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-sm max-w-prose">
                                                Pixel-perfect UI. Robust Backends. Scalable Architecture.
                                            </p>
                                        </div>

                                        {/* MVP CORE OFFER: HEALTH CHECK (Simplified) */}
                                        <div className="bg-gradient-to-r from-green-900/20 to-black border border-green-500/80 p-4 rounded-sm relative overflow-hidden group hover:border-green-400 transition-all box-glow">
                                            <div className="absolute top-0 right-0 bg-green-500 text-black text-[9px] font-bold px-2 py-0.5 shadow-[0_0_10px_rgba(34,197,94,0.6)]">
                                                CORE OFFER
                                            </div>
                                            <div className="flex flex-col gap-2 mb-3">
                                                <h3 className="text-lg font-bold text-white tracking-wider text-glow">
                                                    MODERN WEB DEVELOPMENT
                                                </h3>
                                                <p className="text-green-300 text-xs font-mono">
                                                    Custom high-performance websites & applications built for growth.
                                                </p>
                                            </div>
                                            
                                            <button 
                                                onClick={handleContactExecute}
                                                className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-2 uppercase tracking-widest text-xs transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_25px_rgba(34,197,94,0.8)] hover:scale-[1.01]"
                                            >
                                                START YOUR BUILD &gt;&gt;
                                            </button>
                                        </div>
                                    </div>

                                    {/* SERVICE BLOCKS (Simplified) */}
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                                        <div 
                                            className="border border-green-800 p-3 bg-black/40 hover:border-green-500 transition-all cursor-pointer group flex flex-col justify-between hover:bg-green-900/10 box-glow-hover"
                                            onClick={handleContactExecute}
                                        >
                                            <div>
                                                <p className="text-yellow-400 font-bold text-xs mb-1 group-hover:text-glow">TIER 1: FRONTEND UI/UX</p>
                                                <p className="text-[10px] text-gray-400 mb-2">Pixel-perfect, responsive design with smooth animations & modern frameworks.</p>
                                            </div>
                                            <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                                &gt; VIEW PORTFOLIO
                                            </p>
                                        </div>
                                        <div 
                                            className="border border-green-800 p-3 bg-black/40 hover:border-green-500 transition-all cursor-pointer group flex flex-col justify-between hover:bg-green-900/10 box-glow-hover"
                                            onClick={handleContactExecute}
                                        >
                                            <div>
                                                <p className="text-yellow-400 font-bold text-xs mb-1 group-hover:text-glow">TIER 2: BACKEND & API</p>
                                                <p className="text-[10px] text-gray-400 mb-2">Scalable database architecture, secure APIs, and cloud infrastructure.</p>
                                            </div>
                                            <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                                &gt; VIEW ARCHITECTURE
                                            </p>
                                        </div>
                                        <div 
                                            className="border border-green-800 p-3 bg-black/40 hover:border-green-500 transition-all cursor-pointer group flex flex-col justify-between hover:bg-green-900/10 box-glow-hover"
                                            onClick={handleContactExecute}
                                        >
                                            <div>
                                                <p className="text-yellow-400 font-bold text-xs mb-1 group-hover:text-glow">TIER 3: AI INTEGRATION</p>
                                                <p className="text-[10px] text-gray-400 mb-2">Smart chatbots, process automation, and data-driven insights.</p>
                                            </div>
                                            <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                                &gt; DEPLOY AGENTS
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                <div className="mt-4 pt-3 border-t border-green-900/50 flex flex-col gap-2">
                                    <p className="text-[10px] text-green-500 font-mono opacity-70 mb-1">
                                        TECH STACK: NEXT.JS • TAILWIND • TYPESCRIPT • SUPABASE
                                    </p>
                                    
                                    <div className="grid grid-cols-2 gap-4">
                                        {/* CASE STUDIES */}
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-bold text-green-400 mb-2 border-b border-green-800/50 pb-1">RECENT DEPLOYS</h4>
                                            <ul className="space-y-2">
                                                <li className="text-[10px] text-gray-400 border-l-2 border-green-800 pl-2">
                                                    <span className="text-green-500 font-bold block">SaaS Dashboard</span>
                                                    200% user growth post-launch.
                                                </li>
                                                <li className="text-[10px] text-gray-400 border-l-2 border-green-800 pl-2">
                                                    <span className="text-green-500 font-bold block">E-Commerce Platform</span>
                                                    Sub-second page loads & SEO optimized.
                                                </li>
                                            </ul>
                                        </div>
                                        
                                        {/* TESTIMONIALS */}
                                        <div className="col-span-2 md:col-span-1">
                                            <h4 className="text-[10px] font-bold text-green-400 mb-2 border-b border-green-800/50 pb-1">INTEL / FEEDBACK</h4>
                                            <div className="text-[10px] text-gray-400 italic mb-2 bg-green-900/10 p-2 border border-green-900/30">
                                                &quot;Our new platform isn&apos;t just faster—it&apos;s a conversion machine. The design is stunning.&quot;
                                                <br/><span className="not-italic text-green-600 font-bold mt-1 block">- Founder, Tech Startup</span>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    {/* COMPLIANCE BADGES */}
                                    <div className="mt-2 flex flex-wrap gap-2 opacity-80">
                                        <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">100% LIGHTHOUSE</span>
                                        <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">SEO OPTIMIZED</span>
                                        <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">WCAG 2.1</span>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-green-900/50">
                                        <button 
                                            onClick={handleContactExecute}
                                            className="w-full border border-green-600 text-green-400 hover:bg-green-900/30 font-bold py-2 text-xs uppercase tracking-widest transition-all"
                                        >
                                            SCHEDULE A CALL
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT COLUMN (Spans both rows, contains nested grid) */}
                        <div className="lg:col-span-1 h-full">
                            <RightColumnWrapper 
                                currentTime={currentTime} 
                                currentDate={currentDate} 
                                status={systemStatus} 
                            />
                        </div>
                        
                    </div>
                </div>
            )}

            <ContactModal 
                isOpen={isContactModalOpen} 
                onClose={() => setIsContactModalOpen(false)} 
            />

            <RiskScanModal 
                isOpen={isRiskScanModalOpen} 
                onClose={() => setIsRiskScanModalOpen(false)} 
            />
        </div>
    );
}
