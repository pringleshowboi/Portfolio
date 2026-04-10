// components/TerminalScreen/TerminalScreen.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { format } from 'date-fns'; 
import Image from 'next/image';
import WindowsStartupAudio from '../WindowsStartupAudio/WindowsStartupAudio';
import ChatbotArea from '../ChatbotArea/ChatbotArea'; 
import ContactModal from '../ContactForm/ContactModal';
import RiskScanModal from '../RiskScan/RiskScanModal';
import { motion } from 'framer-motion'; 

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

const MESSAGE_DELAY = 350;
const OS_LOAD_DURATION = 3500;
const PAUSE_AFTER_READY = 700;

interface TerminalScreenProps {
    appState: AppState;
    onOsLoadComplete: () => void;
    onTerminalExecute: (command: 'cards.exe' | 'blog.exe') => void; 
}

const ASCII_CARD_ICON = '\u{1F0DC}';
const ASCII_BLOG_ICON = '\u{1F5A5}'; 
const ASCII_CONTACT_ICON = '\u{2709}';

// J.A.R.V.I.S. Panel - Fixed on the right side
const JarvisPanel = ({ currentTime, currentDate, status }: { currentTime: string; currentDate: string; status: string }) => (
    <div className="fixed right-0 top-0 h-full w-[350px] border-l-2 border-green-400/50 bg-black/80 backdrop-blur-sm z-20 hidden lg:flex flex-col p-4">
        {/* Clock & Globe Widget */}
        <div className="border-2 border-green-400 p-3 flex flex-col items-center mb-4 flex-shrink-0">
            <pre className="text-4xl font-extrabold text-yellow-400 tracking-wider leading-none mb-2">
                {currentTime.slice(0, 5)}
            </pre>
            <p className="text-xs text-green-400 mb-2">{currentDate}</p>
            <div className="w-32 h-8 relative">
                <Image src="/images/globe.gif" alt="Rotating Globe GIF" fill className="object-contain" unoptimized />
            </div>
        </div>
        {/* Chatbot Area */}
        <div className="flex-1 min-h-0">
            <ChatbotArea currentTime={currentTime} status={status} />
        </div>
    </div>
);

// Systems I Build Section - 8 card grid
const SystemsIBuildSection = () => {
    const systems = [
        { icon: '\u{232C}', name: 'AI SOC Assistant', desc: 'Splunk + LLM integration' },
        { icon: '\u{2301}', name: 'Threat Response Pipelines', desc: 'Automated detection & response' },
        { icon: '\u{26E8}', name: 'Secure SaaS Platforms', desc: 'Multi-tenant, zero-trust' },
        { icon: '\u{26B2}', name: 'Mobile Apps', desc: 'Embedded security layers' },
        { icon: '\u{25C8}', name: 'Zero Trust Architecture', desc: 'Enterprise deployments' },
        { icon: '\u{269B}', name: 'Autonomous Security AI', desc: 'Intelligent threat agents' },
        { icon: '\u{25A4}', name: 'SIEM Dashboards', desc: 'Observability & monitoring' },
        { icon: '\u{2601}', name: 'CloudGuard WAF', desc: 'Network security deployments' },
    ];
    return (
        <div className="py-20">
            <h3 className="text-sm font-bold text-yellow-400 mb-6 tracking-widest uppercase text-glow">
                {'// SYSTEMS I BUILD'}
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {systems.map((system, idx) => (
                    <div key={idx} className="border border-green-800/50 bg-black/40 p-4 hover:border-green-500 transition-all hover:bg-green-900/10 group cursor-pointer">
                        <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{system.icon}</div>
                        <h4 className="text-[11px] text-white font-bold mb-1 group-hover:text-green-400">{system.name}</h4>
                        <p className="text-[9px] text-gray-500 font-mono">{system.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Security Stacks Section
const SecurityStacksSection = () => {
    const checkPointStacks = [
        { name: 'Infinity Platform', icon: '\u{25C8}' },
        { name: 'Harmony (Email, Mobile, SaaS, Endpoint, SASE)', icon: '\u{26B7}' },
        { name: 'CloudGuard (Network Security, WAF)', icon: '\u{26EF}' },
        { name: 'Quantum (Force, Spark, IoT, Hyperscale/Maestro)', icon: '' },
    ];
    const splunkStacks = [
        { name: 'Splunk Cloud & Enterprise', icon: '\u{25A4}' },
        { name: 'SIEM + SOAR Automation', icon: '\u{2315}' },
        { name: 'Observability Pipelines', icon: '\u{1F4C8}' },
        { name: 'MSSP Accreditation', icon: '\u{2611}' },
    ];
    return (
        <div className="py-20">
            <h3 className="text-sm font-bold text-yellow-400 mb-6 tracking-widest uppercase text-glow">
                {'// SECURITY STACKS DEPLOYED'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-orange-800/50 bg-orange-900/10 p-5 hover:border-orange-500/50 transition-all">
                    <h4 className="text-orange-400 font-bold text-xs mb-4 uppercase tracking-wider">
                        {'\u{263F}'} CHECK POINT ECOSYSTEM
                    </h4>
                    <div className="space-y-3">
                        {checkPointStacks.map((stack, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                                <span className="text-orange-500">{stack.icon}</span>
                                <span className="font-mono">{stack.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="border border-green-800/50 bg-green-900/10 p-5 hover:border-green-500/50 transition-all">
                    <h4 className="text-green-400 font-bold text-xs mb-4 uppercase tracking-wider">
                        {'\u{25A4}'} SPLUNK ECOSYSTEM
                    </h4>
                    <div className="space-y-3">
                        {splunkStacks.map((stack, idx) => (
                            <div key={idx} className="flex items-center gap-3 text-sm text-gray-300">
                                <span className="text-green-500">{stack.icon}</span>
                                <span className="font-mono">{stack.name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            <p className="text-xs text-green-400 font-mono mt-6 italic text-center opacity-80">
                {'\u0022'}From perimeter to endpoint to cloud &mdash; fully instrumented, monitored, and automated.{'\u0022'}
            </p>
        </div>
    );
};

// Certifications Section
const CertificationsSection = () => {
    const checkpointCerts = [
        'CPSC', 'Infinity Platform', 'Infinity ERM', 'Threat Exposure Mgmt',
        'MSSP', 'Harmony Email', 'Harmony Mobile', 'Harmony SaaS',
        'Harmony Endpoint', 'Harmony SASE', 'CloudGuard Network',
        'CloudGuard WAF', 'Quantum Force', 'Quantum Spark',
        'Quantum IoT', 'Quantum Hyperscale', 'Sales Rep I', 'Technical Selling'
    ];
    const splunkCerts = [
        'Splunk Accredited MSP', 'Splunk Platform SE I', 'Splunk Cloud & Enterprise Developer'
    ];
    return (
        <div className="py-20">
            <h3 className="text-sm font-bold text-yellow-400 mb-6 tracking-widest uppercase text-glow">
                {'// CERTIFIED STACK EXPERTISE'}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="border border-orange-800/50 bg-orange-900/10 p-5">
                    <h4 className="text-orange-400 font-bold text-xs mb-4 uppercase">
                        {'\u{263F}'} CHECK POINT CERTIFICATIONS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {checkpointCerts.map((cert, idx) => (
                            <span key={idx} className="border border-orange-700/50 bg-orange-900/20 px-3 py-1 text-[10px] text-orange-300 font-mono">
                                {cert}
                            </span>
                        ))}
                    </div>
                </div>
                <div className="border border-green-800/50 bg-green-900/10 p-5">
                    <h4 className="text-green-400 font-bold text-xs mb-4 uppercase">
                        {'\u{25A4}'} SPLUNK CERTIFICATIONS
                    </h4>
                    <div className="flex flex-wrap gap-2">
                        {splunkCerts.map((cert, idx) => (
                            <span key={idx} className="border border-green-700/50 bg-green-900/20 px-3 py-1 text-[10px] text-green-300 font-mono">
                                {cert}
                            </span>
                        ))}
                    </div>
                </div>
            </div>
            <p className="text-xs text-green-400 font-mono mt-6 italic text-center opacity-80">
                {'\u0022'}Certified across full-stack security architecture &mdash; from edge to cloud to endpoint to AI-driven response.{'\u0022'}
            </p>
        </div>
    );
};

// Intel Fragments Section
const IntelFragmentsSection = () => (
    <div className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-green-400 mb-3 border-b border-green-800/50 pb-2 tracking-widest uppercase">INTEL FRAGMENTS / RECENT DEPLOYS</h4>
                <div className="border-l-2 border-green-800 pl-4">
                    <p className="text-[11px] text-green-500 font-bold uppercase">Global Security Ops</p>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Deployed Splunk SOAR for fortune 500 company, reducing response time by 70%.</p>
                </div>
                <div className="border-l-2 border-green-800 pl-4">
                    <p className="text-[11px] text-green-500 font-bold uppercase">AI Compliance Agent</p>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Automated HIPAA/GDPR auditing using custom RAG pipeline & autonomous agents.</p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-green-400 mb-3 border-b border-green-800/50 pb-2 tracking-widest uppercase">CERTIFICATIONS & STANDARDS</h4>
                <div className="flex flex-wrap gap-2">
                    {['SOC2 TYPE II', 'ISO 27001', 'ZERO TRUST', 'HIPAA READY', 'OWASP TOP 10'].map((badge, i) => (
                        <span key={i} className="border border-green-800 bg-green-900/20 px-3 py-1.5 text-[10px] text-green-400 font-bold">
                            {badge}
                        </span>
                    ))}
                </div>
                <div className="text-[10px] text-gray-500 font-mono mt-3">
                    {'\u003E'} ENCRYPTION: AES-256-GCM<br/>
                    {'\u003E'} PROTOCOL: TLS 1.3 / QUIC
                </div>
            </div>
        </div>
    </div>
);

type NavSection = 'dashboard' | 'systems' | 'services' | 'intel' | 'audit' | 'checklist';

export default function TerminalScreen({ appState, onOsLoadComplete, onTerminalExecute }: TerminalScreenProps) {
    const [messages, setMessages] = useState<string[]>([]);
    const sequenceStartedRef = useRef(false);
    const [currentTime, setCurrentTime] = useState('');
    const [currentDate, setCurrentDate] = useState('');
    const [systemStatus, setSystemStatus] = useState("System Offline");
    const [isContactModalOpen, setIsContactModalOpen] = useState(false);
    const [isRiskScanModalOpen, setIsRiskScanModalOpen] = useState(false);
    const [activeSection, setActiveSection] = useState<NavSection>('dashboard');

    const handleBlogExecute = () => { onTerminalExecute('blog.exe'); };
    const handleContactExecute = () => { setIsContactModalOpen(true); };
    const handleRiskScanExecute = () => { setIsRiskScanModalOpen(true); };

    const navItems = [
        { id: 'systems' as NavSection, label: 'SYSTEMS', icon: ASCII_CARD_ICON, action: () => setActiveSection('systems') },
        { id: 'services' as NavSection, label: 'SERVICES', icon: ASCII_BLOG_ICON, action: () => setActiveSection('services') },
        { id: 'demo' as NavSection, label: '3D DEMO', icon: '', action: () => window.location.href = '/demo' },
        { id: 'intel' as NavSection, label: 'INTEL', icon: ASCII_CONTACT_ICON, action: handleBlogExecute },
        { id: 'audit' as NavSection, label: 'AUDIT', icon: '\u{1F5CE}', action: handleRiskScanExecute },
        { id: 'checklist' as NavSection, label: 'CHECKLIST', icon: '\u{1F5CE}', action: handleContactExecute },
    ];

    useEffect(() => {
        setSystemStatus(appState === 'terminal' ? "Active - Awaiting Command" : "System Initializing...");
    }, [appState]);

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

    useEffect(() => {
        if (appState === 'booting' && !sequenceStartedRef.current) { runBootSequence(); }
    }, [appState, runBootSequence]);

    useEffect(() => {
        let timeout: NodeJS.Timeout;
        if (appState === 'os_load') {
            timeout = setTimeout(() => { onOsLoadComplete(); }, OS_LOAD_DURATION);
        }
        return () => clearTimeout(timeout);
    }, [appState, onOsLoadComplete]);

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
        <div className={`absolute inset-0 z-10 font-mono flex flex-col justify-start items-start`}> 
            {appState === 'booting' && (
                <div className="w-full h-full p-10 text-green-400 bg-black/90">
                    {messages.map((msg, index) => (
                        <p key={index} className="mb-1">{msg}</p>
                    ))}
                    {isBootingActive && <span className="animate-pulse">_</span>}
                </div>
            )}
            {appState === 'os_load' && (
                <div className="w-full h-full flex flex-col justify-center items-center bg-blue-700 text-white text-3xl font-bold">
                    <WindowsStartupAudio />
                    <p className='animate-pulse'>OS INITIALIZING...</p>
                    <p className='text-sm mt-2'>Loading User Profile...</p>
                </div>
            )}
            {appState === 'terminal' && (
                <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1 }}
                    className="w-full h-full bg-black/95 bg-grid-pattern pointer-events-auto text-green-400 flex flex-col relative overflow-hidden"
                >
                    <div className="absolute inset-0 bg-green-900/5 pointer-events-none z-0" />
                    <div className="absolute inset-0 scanlines opacity-20 pointer-events-none" />
                    
                    {/* Fixed J.A.R.V.I.S. Panel on the right */}
                    <JarvisPanel currentTime={currentTime} currentDate={currentDate} status={systemStatus} />
                    
                    {/* Main Content Area - Scrollable, with padding for fixed JARVIS */}
                    <div className="flex-1 overflow-y-auto custom-scrollbar pr-0 lg:pr-[350px]">
                        <div className="px-6 py-6 md:px-10 md:py-8 min-h-full">
                            {/* Header with Navigation */}
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-10 border-b border-green-800/50 pb-6">
                                <div>
                                    <motion.h1 
                                        initial={{ x: -20, opacity: 0 }}
                                        animate={{ x: 0, opacity: 1 }}
                                        className="text-yellow-400 font-bold tracking-widest text-xl md:text-2xl text-glow"
                                    >
                                        {activeSection === 'dashboard' && 'SECURE INTELLIGENT SYSTEMS'}
                                        {activeSection === 'systems' && 'SYSTEMS & STACKS'}
                                        {activeSection === 'services' && 'SERVICES_MODULE'}
                                        {activeSection === 'intel' && 'INTEL_DATABASE'}
                                        {activeSection === 'audit' && 'SECURITY_AUDIT'}
                                        {activeSection === 'checklist' && 'COMMUNICATION_PROTOCOL'}
                                    </motion.h1>
                                    <h2 className="text-[10px] md:text-xs text-green-300 font-mono opacity-80 font-normal">
                                        Cybersecurity Architecture &middot; AI Automation &middot; Enterprise Security Engineering
                                    </h2>
                                </div>
                                
                                {/* Navigation Buttons */}
                                <div className="flex flex-wrap justify-start md:justify-end gap-3">
                                    {navItems.map((item) => (
                                        <button 
                                            key={item.id}
                                            onClick={item.action}
                                            className={`flex items-center gap-2 text-[10px] transition-all group border px-3 py-1.5 bg-black/40 ${
                                                activeSection === item.id 
                                                    ? 'border-green-400 bg-green-900/30 text-white' 
                                                    : 'border-green-800 hover:border-green-500 hover:bg-green-900/30'
                                            }`}
                                        >
                                            <span className="text-sm group-hover:scale-110 transition-transform">{item.icon}</span>
                                            <span className="hidden sm:inline font-bold tracking-tighter">{item.label}</span>
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Section Content */}
                            <div className="flex flex-col gap-8">
                                {/* Dashboard Section (Page 1) */}
                                {activeSection === 'dashboard' && (
                                    <>
                                        <div className="border-l-2 border-green-500 pl-4 py-1">
                                            <h3 className="text-green-300 font-semibold tracking-wide text-xs mb-1 uppercase text-glow">
                                                {'// MISSION OBJECTIVE'}
                                            </h3>
                                            <p className="text-gray-300 leading-relaxed text-base md:text-lg font-bold max-w-3xl italic">
                                                {'\u0022'}I design and build secure, intelligent systems that scale &mdash; and defend them.{'\u0022'}
                                            </p>
                                        </div>

                                        {/* Hero Card */}
                                        <div className="bg-gradient-to-r from-green-900/20 via-black to-black border border-green-500/80 p-6 rounded-sm relative overflow-hidden group hover:border-green-400 transition-all box-glow">
                                            <div className="absolute top-0 right-0 bg-red-600 text-white text-[10px] font-bold px-3 py-1 shadow-[0_0_15px_rgba(220,38,38,0.6)] animate-pulse">
                                                SYSTEMS ONLINE
                                            </div>
                                            <div className="flex flex-col gap-2 mb-6">
                                                <h3 className="text-xl md:text-2xl font-bold text-white tracking-wider text-glow">
                                                    SECURE INTELLIGENT SYSTEMS
                                                </h3>
                                                <p className="text-green-300 text-sm font-mono opacity-90">
                                                    Deploying enterprise-grade defense and autonomous intelligence.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="bg-black/40 p-4 border border-green-900/50">
                                                    <p className="text-yellow-400 font-bold text-xs mb-2">SYSTEMS I BUILD:</p>
                                                    <ul className="text-[11px] text-gray-300 space-y-1.5">
                                                        <li>{'\u003E'} AI SOC Assistant {'\u0026'} Automation</li>
                                                        <li>{'\u003E'} Threat Detection Pipelines</li>
                                                        <li>{'\u003E'} Secure Cloud-Native Platforms</li>
                                                        <li>{'\u003E'} Zero-Trust Architectures</li>
                                                    </ul>
                                                </div>
                                                <div className="bg-black/40 p-4 border border-green-900/50">
                                                    <p className="text-yellow-400 font-bold text-xs mb-2">SECURITY STACK:</p>
                                                    <ul className="text-[11px] text-gray-300 space-y-1.5">
                                                        <li>{'\u003E'} Check Point (Quantum, CloudGuard)</li>
                                                        <li>{'\u003E'} Splunk (SIEM, SOAR, ITSI)</li>
                                                        <li>{'\u003E'} Python, Rust, Go, TypeScript</li>
                                                        <li>{'\u003E'} Kubernetes, Terraform, CI/CD</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleContactExecute}
                                                className="w-full bg-green-600 hover:bg-green-500 text-black font-extrabold py-3 uppercase tracking-[0.2em] text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] hover:scale-[1.01]"
                                            >
                                                REQUEST SECURITY AUDIT {'\u003E\u003E'}
                                            </button>
                                        </div>

                                        {/* Tier Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { tier: 'TIER 1', title: 'PLATFORM ENGINEERING', desc: 'Full-stack web apps, Mobile applications, Distributed systems, SaaS platforms.', cta: 'VIEW PLATFORMS' },
                                                { tier: 'TIER 2', title: 'CYBER DEFENSE', desc: 'Check Point Infinity, SIEM architecture, Threat detection, Zero Trust.', cta: 'VIEW DEFENSE' },
                                                { tier: 'TIER 3', title: 'AI AUTOMATION', desc: 'Autonomous agents, Security AI, ChatOps, Intelligent pipelines.', cta: 'DEPLOY AGENTS' },
                                                { tier: 'TIER 4', title: 'ENTERPRISE STACKS', desc: 'Check Point, Splunk, MSSP-grade managed security.', cta: 'VIEW STACK' }
                                            ].map((block, idx) => (
                                                <div key={idx} className="border border-green-800 p-5 bg-black/40 hover:border-green-500 transition-all cursor-pointer group hover:bg-green-900/10 box-glow-hover" onClick={handleContactExecute}>
                                                    <p className="text-yellow-400 font-bold text-[10px] mb-2 group-hover:text-glow">{block.tier}</p>
                                                    <h4 className="text-white font-bold text-sm mb-3 group-hover:text-green-400">{block.title}</h4>
                                                    <p className="text-[10px] text-gray-400 leading-relaxed mb-4">{block.desc}</p>
                                                    <p className="text-[10px] text-green-500 font-bold uppercase group-hover:underline tracking-wider">
                                                        {'\u003E'} {block.cta}
                                                    </p>
                                                </div>
                                            ))}
                                        </div>

                                        {/* Status Bar */}
                                        <div className="flex flex-wrap gap-4 text-[10px] text-green-500 font-mono opacity-80">
                                            <div className="flex items-center gap-2 border border-green-900/50 px-3 py-1.5 bg-green-900/10">
                                                <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                                                SIEM: ACTIVE
                                            </div>
                                            <div className="flex items-center gap-2 border border-green-900/50 px-3 py-1.5 bg-green-900/10">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                AI MODELS: ONLINE
                                            </div>
                                            <div className="flex items-center gap-2 border border-green-900/50 px-3 py-1.5 bg-green-900/10">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                THREAT LEVEL: LOW
                                            </div>
                                        </div>
                                    </>
                                )}

                                {/* Systems & Stacks Section (Page 2) */}
                                {activeSection === 'systems' && (
                                    <>
                                        <SystemsIBuildSection />
                                        <SecurityStacksSection />
                                        <CertificationsSection />
                                        <IntelFragmentsSection />
                                    </>
                                )}

                                {/* Services Section */}
                                {activeSection === 'services' && (
                                    <div className="py-20 space-y-6">
                                        <div className="border-l-2 border-yellow-500 pl-4 py-2">
                                            <h3 className="text-yellow-400 font-bold tracking-wide text-sm uppercase text-glow">
                                                {'// AVAILABLE SERVICES'}
                                            </h3>
                                            <p className="text-gray-300 text-sm mt-1">Select a service tier for detailed specifications.</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { tier: 'TIER 1', title: 'PLATFORM ENGINEERING', desc: 'Full-stack web apps (Next.js, APIs, Databases), Mobile applications (React Native / Flutter), High-performance distributed systems, Secure multi-tenant SaaS platforms.' },
                                                { tier: 'TIER 2', title: 'CYBER DEFENSE & GOVERNANCE', desc: 'Check Point Infinity Platform integration, SIEM architecture & Splunk deployment, Threat detection pipelines, Identity & Access Management, Zero Trust Architecture, Compliance frameworks (ISO 27001, SOC2).' },
                                                { tier: 'TIER 3', title: 'AI AUTOMATION SYSTEMS', desc: 'Autonomous AI agents & workflows, Security AI (threat detection, anomaly detection), ChatOps / internal AI copilots, Intelligent automation pipelines.' },
                                                { tier: 'TIER 4', title: 'ENTERPRISE SECURITY STACKS', desc: 'Check Point (Infinity, Harmony, CloudGuard, Quantum), Splunk (SIEM, SOAR, Observability), MSSP-grade managed security services.' }
                                            ].map((service, idx) => (
                                                <div key={idx} className="border border-green-800 p-6 bg-black/40 hover:border-green-500 transition-all cursor-pointer group hover:bg-green-900/10">
                                                    <div className="flex items-start justify-between">
                                                        <div>
                                                            <p className="text-yellow-400 font-bold text-xs mb-2">{service.tier}</p>
                                                            <h4 className="text-white font-bold text-lg mb-3 group-hover:text-green-400">{service.title}</h4>
                                                            <p className="text-sm text-gray-400 leading-relaxed max-w-2xl">{service.desc}</p>
                                                        </div>
                                                        <span className="text-green-500 text-xl group-hover:translate-x-1 transition-transform">{'\u003E'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="flex gap-4 pt-4">
                                            <button onClick={handleContactExecute} className="flex-1 bg-green-600 hover:bg-green-500 text-black font-bold py-3 uppercase tracking-widest transition-all">
                                                REQUEST CONSULTATION
                                            </button>
                                            <button onClick={() => setActiveSection('dashboard')} className="px-6 border border-green-600 text-green-400 hover:bg-green-900/30 font-bold py-3 uppercase tracking-widest transition-all">
                                                BACK
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* Audit Section */}
                                {activeSection === 'audit' && (
                                    <div className="py-20 space-y-6">
                                        <div className="border-l-2 border-red-500 pl-4 py-2">
                                            <h3 className="text-red-400 font-bold tracking-wide text-sm uppercase">
                                                {'// SECURITY AUDIT PROTOCOL'}
                                            </h3>
                                            <p className="text-gray-300 text-sm mt-1">Initiate a comprehensive security assessment.</p>
                                        </div>

                                        <div className="bg-red-900/10 border border-red-800/50 p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-3xl">{'\u26A0}'}</span>
                                                <div>
                                                    <h4 className="text-red-400 font-bold text-lg">DIGITAL PERIMETER SCAN</h4>
                                                    <p className="text-sm text-gray-400">Automated vulnerability assessment and risk analysis</p>
                                                </div>
                                            </div>
                                            <ul className="text-sm text-gray-300 space-y-2 mb-6">
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> DNS & SSL Certificate Analysis
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Open Port Detection
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> API Endpoint Security Review
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Credential Leak Database Check
                                                </li>
                                            </ul>
                                            <button onClick={handleRiskScanExecute} className="w-full bg-red-600 hover:bg-red-500 text-black font-bold py-3 uppercase tracking-widest transition-all">
                                                INITIATE SCAN
                                            </button>
                                        </div>

                                        <button onClick={() => setActiveSection('dashboard')} className="px-6 border border-green-600 text-green-400 hover:bg-green-900/30 font-bold py-3 uppercase tracking-widest transition-all">
                                            {'\u003C'} BACK TO DASHBOARD
                                        </button>
                                    </div>
                                )}

                                {/* Checklist Section */}
                                {activeSection === 'checklist' && (
                                    <div className="py-20 space-y-6">
                                        <div className="border-l-2 border-blue-500 pl-4 py-2">
                                            <h3 className="text-blue-400 font-bold tracking-wide text-sm uppercase">
                                                {'// SECURE COMMUNICATIONS'}
                                            </h3>
                                            <p className="text-gray-300 text-sm mt-1">Encrypted channel for project inquiries.</p>
                                        </div>

                                        <div className="bg-blue-900/10 border border-blue-800/50 p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-3xl">{'\u{1F512}'}</span>
                                                <div>
                                                    <h4 className="text-blue-400 font-bold text-lg">ESTABLISH SECURE CHANNEL</h4>
                                                    <p className="text-sm text-gray-400">End-to-end encrypted communication protocol</p>
                                                </div>
                                            </div>
                                            <ul className="text-sm text-gray-300 space-y-2 mb-6">
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> AES-256-GCM Encryption
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> TLS 1.3 / QUIC Protocol
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Zero-Knowledge Transmission
                                                </li>
                                            </ul>
                                            <button onClick={handleContactExecute} className="w-full bg-blue-600 hover:bg-blue-500 text-black font-bold py-3 uppercase tracking-widest transition-all">
                                                OPEN SECURE COMMS
                                            </button>
                                        </div>

                                        <button onClick={() => setActiveSection('dashboard')} className="px-6 border border-green-600 text-green-400 hover:bg-green-900/30 font-bold py-3 uppercase tracking-widest transition-all">
                                            {'\u003C'} BACK TO DASHBOARD
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </motion.div>
            )}
            <ContactModal isOpen={isContactModalOpen} onClose={() => setIsContactModalOpen(false)} />
            <RiskScanModal isOpen={isRiskScanModalOpen} onClose={() => setIsRiskScanModalOpen(false)} />
        </div>
    );
}