// components/TerminalScreen/TerminalScreen.tsx
'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
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

const ASCII_CARD_ICON = '[>]';
const ASCII_BLOG_ICON = '[::]'; 
const ASCII_CONTACT_ICON = '[@]';

// M4N Panel - Fixed on the right side
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
        { icon: '#', name: 'GRC Advisory', desc: 'POPIA readiness & governance' },
        { icon: '%', name: 'Risk Assessment', desc: 'Registers & control mapping' },
        { icon: '&', name: 'Audit Readiness', desc: 'Policies, evidence & prep' },
        { icon: '$', name: 'Dashboards', desc: 'Reporting & executive insight' },
        { icon: '~', name: 'Data Pipelines', desc: 'ETL, cleanup & migrations' },
        { icon: '@', name: 'Business Websites', desc: 'Secure, fast, maintainable' },
        { icon: '+', name: 'CRM Tooling', desc: 'Database-backed client systems' },
        { icon: '^', name: 'Automation', desc: 'Workflows & integrations' },
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

// Platform Experience Section — honest framing: certified training + lab
// environment. No "deployed stack" claims; procurement/integration support only.
const PLATFORM_EXPERIENCE = [
    {
        heading: 'CHECK POINT ECOSYSTEM',
        accent: 'orange' as const,
        items: ['Quantum, Harmony, CloudGuard training', 'Always-on NFR lab environment', 'Procurement guidance & licensing navigation'],
    },
    {
        heading: 'SPLUNK ECOSYSTEM',
        accent: 'green' as const,
        items: ['Platform SE I + Developer accreditations', 'SIEM/SOAR concepts & dashboard builds (lab)', 'Integration support while your team operates'],
    },
    {
        heading: 'OPEN-SOURCE LAB',
        accent: 'blue' as const,
        items: ['Wazuh SIEM — rules tested before recommended', 'Proxmox homelab cluster', 'pfSense perimeter experiments'],
    },
];

const ACCENT_CLASSES = {
    orange: { border: 'border-orange-800/50 bg-orange-900/10', text: 'text-orange-400' },
    green: { border: 'border-green-800/50 bg-green-900/10', text: 'text-green-400' },
    blue: { border: 'border-blue-800/50 bg-blue-900/10', text: 'text-blue-400' },
};

const SecurityStacksSection = () => {
    return (
        <div className="py-20">
            <h3 className="text-sm font-bold text-yellow-400 mb-2 tracking-widest uppercase text-glow">
                {'// PLATFORM EXPERIENCE'}
            </h3>
            <p className="text-[11px] text-gray-400 font-mono mb-6 max-w-3xl leading-relaxed">
                {'\u003E'} Hands-on familiarity through certified training and a permanent lab environment.
                I do not run these stacks as a managed service &mdash; I help you choose, procure, and integrate them.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {PLATFORM_EXPERIENCE.map((col) => (
                    <div key={col.heading} className={`border p-5 hover:border-green-500/50 transition-all ${ACCENT_CLASSES[col.accent].border}`}>
                        <h4 className={`${ACCENT_CLASSES[col.accent].text} font-bold text-xs mb-4 uppercase tracking-wider`}>
                            {'>'} {col.heading}
                        </h4>
                        <ul className="space-y-2.5 text-[11px] text-gray-300 font-mono">
                            {col.items.map((item) => (
                                <li key={item} className="flex items-start gap-2">
                                    <span className={ACCENT_CLASSES[col.accent].text}>{'\u003E'}</span>
                                    {item}
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>
        </div>
    );
};

// Certifications Section
const CertificationsSection = () => {
    const checkpointCerts = [
        'CPSC', 'Infinity Platform', 'Infinity ERM', 'Threat Exposure Mgmt',
        'Harmony Email', 'Harmony Mobile', 'Harmony SaaS',
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
                        {'>'} CHECK POINT CERTIFICATIONS
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
                        {'>'} SPLUNK CERTIFICATIONS
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
                {'\u0022'}Platform certifications support the advisory work &mdash; they inform what I recommend, procure, and integrate for clients.{'\u0022'}
            </p>
        </div>
    );
};

// Intel Fragments Section
const IntelFragmentsSection = () => (
    <div className="py-20">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-green-400 mb-3 border-b border-green-800/50 pb-2 tracking-widest uppercase">INTEL FRAGMENTS / FIELD NOTES</h4>
                <div className="border-l-2 border-green-800 pl-4">
                    <p className="text-[11px] text-green-500 font-bold uppercase">Lab Environment</p>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Proxmox-hosted homelab running Wazuh SIEM and self-hosted services &mdash; where detection rules get tested before they get recommended.</p>
                </div>
                <div className="border-l-2 border-green-800 pl-4">
                    <p className="text-[11px] text-green-500 font-bold uppercase">AI Red-Teaming</p>
                    <p className="text-[10px] text-gray-400 italic leading-relaxed">Hands-on LLM red-teaming exercises probing for prompt-injection and data-leak weaknesses &mdash; findings documented on the intel feed.</p>
                </div>
            </div>
            <div className="space-y-4">
                <h4 className="text-[11px] font-bold text-green-400 mb-3 border-b border-green-800/50 pb-2 tracking-widest uppercase">FRAMEWORKS I WORK WITH</h4>
                <div className="flex flex-wrap gap-2">
                    {['POPIA', 'ISO 27001', 'OWASP TOP 10', 'CIS CONTROLS', 'NIST CSF'].map((badge, i) => (
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
    const router = useRouter();
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
        { id: 'systems' as NavSection, label: 'CAPABILITIES', icon: ASCII_CARD_ICON, action: () => setActiveSection('systems') },
        { id: 'services' as NavSection, label: 'SERVICES', icon: ASCII_BLOG_ICON, action: () => setActiveSection('services') },
        { id: 'pricing' as NavSection, label: 'PRICING', icon: '[$]', action: () => router.push('/pricing') },
        { id: 'demo' as NavSection, label: '3D DEMO', icon: '', action: () => window.location.href = '/demo' },
        { id: 'intel' as NavSection, label: 'INTEL FEED', icon: ASCII_CONTACT_ICON, action: handleBlogExecute },
        { id: 'audit' as NavSection, label: 'COMPLIANCE SCAN', icon: '[!]', action: handleRiskScanExecute },
        { id: 'checklist' as NavSection, label: 'CONTACT', icon: '[@]', action: handleContactExecute },
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
                                        GRC &amp; Compliance Advisory &middot; Data Analysis &amp; Engineering &middot; Full-Stack Web Development
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
                                                {'\u0022'}Compliance guidance, sharp data work, and web platforms built to run your business.{'\u0022'}
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
                                                    Advisory, data, and web &mdash; delivered on a security-first foundation.
                                                </p>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                                <div className="bg-black/40 p-4 border border-green-900/50">
                                                    <p className="text-yellow-400 font-bold text-xs mb-2">WHAT I DELIVER:</p>
                                                    <ul className="text-[11px] text-gray-300 space-y-1.5">
                                                        <li>{'\u003E'} GRC &amp; Compliance Advisory (POPIA)</li>
                                                        <li>{'\u003E'} Dashboards &amp; Data Pipelines</li>
                                                        <li>{'\u003E'} Business Websites</li>
                                                        <li>{'\u003E'} CRM / Database Tooling</li>
                                                    </ul>
                                                </div>
                                                <div className="bg-black/40 p-4 border border-green-900/50">
                                                    <p className="text-yellow-400 font-bold text-xs mb-2">TOOLBOX:</p>
                                                    <ul className="text-[11px] text-gray-300 space-y-1.5">
                                                        <li>{'\u003E'} Next.js, TypeScript, React</li>
                                                        <li>{'\u003E'} Python, SQL, Supabase/Postgres</li>
                                                        <li>{'\u003E'} Check Point &amp; Splunk (lab exp.)</li>
                                                        <li>{'\u003E'} Wazuh SIEM + Proxmox homelab</li>
                                                    </ul>
                                                </div>
                                            </div>
                                            <button 
                                                onClick={handleContactExecute}
                                                className="w-full bg-green-600 hover:bg-green-500 text-black font-extrabold py-3 uppercase tracking-[0.2em] text-sm transition-all shadow-[0_0_15px_rgba(34,197,94,0.5)] hover:shadow-[0_0_30px_rgba(34,197,94,0.8)] hover:scale-[1.01]"
                                            >
                                                START A PROJECT {'\u003E\u003E'}
                                            </button>
                                        </div>

                                        {/* Tier Cards */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            {[
                                                { tier: 'TIER 1', title: 'FULL-STACK WEB DEVELOPMENT', desc: 'Business websites, CRM & database-backed tooling, client system integration. Secure by default.', cta: 'START A BUILD' },
                                                { tier: 'TIER 2', title: 'DATA ANALYSIS & ENGINEERING', desc: 'Dashboards, reporting pipelines, ETL & migrations, workflow automation that cuts manual admin.', cta: 'DISCUSS YOUR DATA' },
                                                { tier: 'TIER 3', title: 'GRC & COMPLIANCE ADVISORY', desc: 'POPIA compliance assessment, policy development, risk register setup, audit readiness prep.', cta: 'BOOK CONSULT' },
                                                { tier: 'TIER 4', title: 'PLATFORM EXPERIENCE', desc: 'Check Point & Splunk certified training + NFR lab. Procurement guidance & integration support.', cta: 'VIEW EXPERIENCE' }
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
                                                AVAILABILITY: OPEN
                                            </div>
                                            <div className="flex items-center gap-2 border border-green-900/50 px-3 py-1.5 bg-green-900/10">
                                                <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></span>
                                                SCOPING: PER ENGAGEMENT
                                            </div>
                                            <div className="flex items-center gap-2 border border-green-900/50 px-3 py-1.5 bg-green-900/10">
                                                <span className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></span>
                                                BASE: SOUTH AFRICA
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
                                            <p className="text-gray-300 text-sm mt-1">Every engagement is scoped individually. See PRICING for engagement models.</p>
                                        </div>
                                        
                                        <div className="grid grid-cols-1 gap-4">
                                            {[
                                                { tier: 'TIER 1', title: 'FULL-STACK WEB DEVELOPMENT', desc: 'Business websites that load fast and stay up. CRM & database-backed tooling built around your workflow (Next.js, APIs, databases). Client system integration. Security baked in by default.' },
                                                { tier: 'TIER 2', title: 'DATA ANALYSIS & ENGINEERING', desc: 'Dashboards and reports executives actually read. Data pipelines, cleanup & ETL. Spreadsheet-to-database migrations. Workflow automation that cuts manual admin.' },
                                                { tier: 'TIER 3', title: 'GRC & COMPLIANCE ADVISORY', desc: 'POPIA compliance assessment & gap analysis. Policy development & review. Risk register setup & maintenance. Audit readiness preparation.' },
                                                { tier: 'TIER 4', title: 'PLATFORM EXPERIENCE & PROCUREMENT', desc: 'Certified Check Point & Splunk training with an always-on NFR lab. Procurement guidance & integration support while your team operates the platform.' }
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
                                            <button onClick={() => router.push('/pricing')} className="px-6 border border-yellow-500 text-yellow-400 hover:bg-yellow-900/30 font-bold py-3 uppercase tracking-widest transition-all">
                                                VIEW PRICING
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
                                                {'// COMPLIANCE & RISK SNAPSHOT'}
                                            </h3>
                                            <p className="text-gray-300 text-sm mt-1">A free automated look at your public security posture.</p>
                                        </div>

                                        <div className="bg-red-900/10 border border-red-800/50 p-6">
                                            <div className="flex items-center gap-3 mb-4">
                                                <span className="text-3xl">{'[!]'}</span>
                                                <div>
                                                    <h4 className="text-red-400 font-bold text-lg">PUBLIC POSTURE SNAPSHOT</h4>
                                                    <p className="text-sm text-gray-400">Automated external checks that feed a compliance conversation</p>
                                                </div>
                                            </div>
                                            <ul className="text-sm text-gray-300 space-y-2 mb-6">
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Public DNS record hygiene
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> TLS certificate validity &amp; posture
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Email spoofing protection (SPF / DMARC)
                                                </li>
                                                <li className="flex items-center gap-2">
                                                    <span className="text-green-500">{'\u003E'}</span> Security headers review
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
                                                <span className="text-3xl">{'[##]'}</span>
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