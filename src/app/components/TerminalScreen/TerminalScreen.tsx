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
                                            Explore our Cybersecurity, GRC, and Development solutions.
                                        </span>
                                    </div>
                                </div>

                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2 ml-[-2]"
                                    onClick={handleBlogExecute} 
                                >
                                    <pre className="leading-none text-6xl text-green-400 hover:text-white">{ASCII_BLOG_ICON}</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">intel.exe</span>
                                        <span className="text-xs text-green-300">
                                            Security advisories, threat analysis, and industry insights.
                                        </span>
                                    </div>
                                </div>

                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2 ml-[-2]"
                                    onClick={handleRiskScanExecute}
                                >
                                    <pre className="leading-none text-6xl text-green-400 hover:text-white">{ASCII_CONTACT_ICON}</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">risk_score.exe</span>
                                        <span className="text-xs text-green-300">
                                            GET RISK SCORE.
                                            <br/>
                                            Identify gaps before they are exploited.
                                        </span>
                                    </div>
                                </div>

                                <div 
                                    className="cursor-pointer hover:text-white flex items-start space-x-2 ml-[-2] opacity-80"
                                    onClick={handleContactExecute}
                                >
                                    <pre className="leading-none text-6xl text-green-400 hover:text-white">🗎</pre>
                                    <div className="flex flex-col ml-2 mt-6">
                                        <span className="text-sm">checklist.pdf</span>
                                        <span className="text-xs text-green-300">
                                            Download the Cyber Readiness Checklist.
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        <div 
                            className="border-t-2 border-l-2 border-b-2 border-green-400 px-4 py-3 flex flex-col justify-start text-xs md:text-sm leading-relaxed lg:col-span-2 lg:row-span-1"
                        >
                            <div className="flex flex-col md:flex-row md:items-baseline md:justify-between gap-2 mb-3">
                                <h1 className="text-yellow-400 font-bold tracking-widest text-lg md:text-xl">SECURE_FIRST.DASH</h1>
                                <h2 className="text-[10px] md:text-xs text-green-300 font-mono opacity-80 font-normal">
                                    Cybersecurity • GRC • Software • AI Automation
                                </h2>
                            </div>

                            <div className="flex flex-col gap-8">
                                <div className="space-y-6">
                                    <div className="border-l-2 border-green-700 pl-4 py-1">
                                        <h3 className="text-green-300 font-semibold tracking-wide text-xs mb-2 uppercase">
                                            {'// SECURE YOUR BUSINESS BEFORE IT BECOMES A HEADLINE'}
                                        </h3>
                                        <p className="text-gray-300 leading-relaxed text-sm max-w-prose">
                                            We identify your cyber risks, compliance gaps, and software vulnerabilities — then give you a clear action plan.
                                        </p>
                                    </div>

                                    {/* MVP CORE OFFER: HEALTH CHECK */}
                                    <div className="bg-green-900/10 border border-green-500 p-6 rounded-sm relative overflow-hidden group hover:bg-green-900/20 transition-all">
                                        <div className="absolute top-0 right-0 bg-green-500 text-black text-[10px] font-bold px-3 py-1">
                                            MVP CORE OFFER
                                        </div>
                                        <div className="flex justify-between items-start mb-4">
                                            <h3 className="text-xl font-bold text-white tracking-wider">
                                                CYBERSECURITY HEALTH CHECK
                                            </h3>
                                        </div>
                                        <p className="text-green-300 text-sm mb-6 font-mono">
                                            Rapid assessment revealing risk exposure & clear roadmap.
                                        </p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3 text-sm text-gray-400 mb-6">
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-3">✓</span> Malware Exposure Scan
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-3">✓</span> GRC Quick Audit (POPIA/ISO)
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-3">✓</span> Software Security Review
                                            </div>
                                            <div className="flex items-center">
                                                <span className="text-green-500 mr-3">✓</span> AI Risk Briefing
                                            </div>
                                        </div>

                                        <button 
                                            onClick={handleRiskScanExecute}
                                            className="w-full bg-green-600 hover:bg-green-500 text-black font-bold py-3 uppercase tracking-widest text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.4)] hover:shadow-[0_0_25px_rgba(34,197,94,0.6)]"
                                        >
                                            GET YOUR CYBER RISK SCORE &gt;&gt;
                                        </button>
                                    </div>
                                </div>

                                {/* SERVICE BLOCKS */}
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div 
                                        className="border border-green-800 p-3 bg-black/40 hover:border-green-600 transition-colors cursor-pointer group flex flex-col justify-between"
                                        onClick={handleContactExecute}
                                    >
                                        <div>
                                            <p className="text-yellow-400 font-bold text-xs mb-1">TIER 1: REMEDIATION</p>
                                            <p className="text-[10px] text-gray-400 mb-2">Threat hunting, vuln scanning, patch guidance & secure code review.</p>
                                        </div>
                                        <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                            &gt; SCAN MY EXPOSURE
                                        </p>
                                    </div>
                                    <div 
                                        className="border border-green-800 p-3 bg-black/40 hover:border-green-600 transition-colors cursor-pointer group flex flex-col justify-between"
                                        onClick={handleContactExecute}
                                    >
                                        <div>
                                            <p className="text-yellow-400 font-bold text-xs mb-1">TIER 2: GRC IMPLEMENTATION</p>
                                            <p className="text-[10px] text-gray-400 mb-2">ISO 27001-aligned risk mgmt, policy frameworks & audit readiness.</p>
                                        </div>
                                        <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                            &gt; CHECK COMPLIANCE GAPS
                                        </p>
                                    </div>
                                    <div 
                                        className="border border-green-800 p-3 bg-black/40 hover:border-green-600 transition-colors cursor-pointer group flex flex-col justify-between"
                                        onClick={handleContactExecute}
                                    >
                                        <div>
                                            <p className="text-yellow-400 font-bold text-xs mb-1">TIER 3: SOFTWARE & AI</p>
                                            <p className="text-[10px] text-gray-400 mb-2">Secure web apps, APIs & custom AI solutions with security-first design.</p>
                                        </div>
                                        <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline mt-auto">
                                            &gt; BUILD THIS SECURELY
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 pt-3 border-t border-green-900/50 flex flex-col gap-2">
                                <p className="text-[10px] text-green-500 font-mono opacity-70 mb-1">
                                    TRUST SIGNALS: COMPLIANCE READY • SECURE ARCHITECTURE • RAPID RESPONSE
                                </p>
                                
                                <div className="grid grid-cols-2 gap-4">
                                    {/* CASE STUDIES */}
                                    <div className="col-span-2 md:col-span-1">
                                        <h4 className="text-[10px] font-bold text-green-400 mb-2 border-b border-green-800/50 pb-1">RECENT MISSIONS</h4>
                                        <ul className="space-y-2">
                                            <li className="text-[10px] text-gray-400 border-l-2 border-green-800 pl-2">
                                                <span className="text-green-500 font-bold block">FinTech Audit</span>
                                                Closed 12 critical vulnerabilities before launch.
                                            </li>
                                            <li className="text-[10px] text-gray-400 border-l-2 border-green-800 pl-2">
                                                <span className="text-green-500 font-bold block">SaaS Compliance</span>
                                                Achieved POPIA readiness in 3 weeks.
                                            </li>
                                        </ul>
                                    </div>
                                    
                                    {/* TESTIMONIALS */}
                                    <div className="col-span-2 md:col-span-1">
                                        <h4 className="text-[10px] font-bold text-green-400 mb-2 border-b border-green-800/50 pb-1">INTEL / FEEDBACK</h4>
                                        <div className="text-[10px] text-gray-400 italic mb-2 bg-green-900/10 p-2 border border-green-900/30">
                                            &quot;The health check revealed risks we didn&apos;t know existed. The roadmap was clear and actionable.&quot;
                                            <br/><span className="not-italic text-green-600 font-bold mt-1 block">- CTO, Logistics Firm</span>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* COMPLIANCE BADGES */}
                                <div className="mt-2 flex flex-wrap gap-2 opacity-80">
                                    <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">ISO 27001 READY</span>
                                    <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">POPIA COMPLIANT</span>
                                    <span className="border border-green-800 bg-green-900/20 px-2 py-1 text-[9px] text-green-400 font-bold">OWASP TOP 10</span>
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
