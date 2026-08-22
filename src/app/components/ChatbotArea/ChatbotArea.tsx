'use client';

import { useState, useEffect, useRef } from 'react';
import JarvisAvatar, { JarvisEmotion } from '../JarvisAvatar/JarvisAvatar';
import Typewriter from '../Typewriter/Typewriter';

const initialMessageText = "Hello, I am J.A.R.V.I.S., an Interactive Interface for this portfolio. Ask about GRC advisory, data engineering, or web development.";

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'jarvis';
    timestamp: number;
}

interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

interface ChatbotAreaProps {
    status: string;
    currentTime: string;
}

const SUGGESTED_PROMPTS = [
    "How does a POPIA assessment work?",
    "Show web development capabilities",
    "What data work do you do?",
    "Explain your platform experience",
    "What's missing from my compliance posture?",
    "How much does a website cost?",
];

const getEmotionFromText = (text: string, isThinkingNow: boolean): JarvisEmotion => {
    if (isThinkingNow) return 'idle';
    return 'talking';
};

const processQueryFallback = (query: string): string => {
    const lowerQuery = query.toLowerCase();
    if (lowerQuery === 'help' || lowerQuery === 'commands') {
        return "COMMANDS AVAILABLE:\n- Ask about GRC & compliance advisory\n- Ask about data analysis & engineering\n- Ask about web development\n- Ask about platform experience\n- Type 'audit' to request a compliance snapshot";
    }
    if (lowerQuery.includes('checkpoint') || lowerQuery.includes('check point') || lowerQuery.includes('infinity')) {
        return "CHECK POINT EXPERIENCE: Certified training (CPSC, Infinity Platform, Harmony, CloudGuard, Quantum) plus an always-on NFR lab. I help you select, procure and integrate \u2014 deployment and operations stay with your team.";
    }
    if (lowerQuery.includes('splunk') || lowerQuery.includes('siem') || lowerQuery.includes('soar')) {
        return "SPLUNK EXPERIENCE: Accredited training (Platform SE I, Cloud & Enterprise Developer). SIEM/SOAR concepts inform the monitoring and reporting advice I give. Lab environment only \u2014 not a hosted SOC.";
    }
    if (lowerQuery.includes('audit') || lowerQuery.includes('security') || lowerQuery.includes('contact')) {
        return "INITIATING SECURE HANDSHAKE...\nSTATUS: Use the COMPLIANCE SNAPSHOT button or SECURE COMMS to connect.";
    }
    if (lowerQuery.includes('popia') || lowerQuery.includes('compliance') || lowerQuery.includes('grc') || lowerQuery.includes('risk') || lowerQuery.includes('policy')) {
        return "GRC ADVISORY: POPIA compliance assessments, policy development & review, risk register setup, audit readiness preparation. Scoped per engagement \u2014 no retainers you don't need.";
    }
    if (lowerQuery.includes('data') || lowerQuery.includes('dashboard') || lowerQuery.includes('report') || lowerQuery.includes('pipeline')) {
        return "DATA SERVICES: Reporting dashboards executives actually read, data pipelines & ETL, spreadsheet-to-database migrations, workflow automation that cuts manual admin.";
    }
    if (lowerQuery.includes('ai') || lowerQuery.includes('agent') || lowerQuery.includes('automation')) {
        return "AUTOMATION & AI: workflow automation, AI-assisted data analysis, internal copilots, and the pipelines that feed them.";
    }
    if (lowerQuery.includes('platform') || lowerQuery.includes('web') || lowerQuery.includes('mobile') || lowerQuery.includes('crm')) {
        return "WEB DEVELOPMENT: business websites that load fast and stay up, CRM/database-backed tooling built around your workflow, client system integration. Secure by default.";
    }
    return "I am J.A.R.V.I.S., an AI assistant for this portfolio. Ask me about GRC advisory, data engineering, web development, or platform experience.";
};

export default function ChatbotArea({}: ChatbotAreaProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', text: initialMessageText, sender: 'jarvis', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [emotion, setEmotion] = useState<JarvisEmotion>('idle');
    const [isThinking, setIsThinking] = useState(false);
    const [remaining, setRemaining] = useState<number | null>(null);
    const [isRateLimited, setIsRateLimited] = useState(false);
    const [showEmailCapture, setShowEmailCapture] = useState(false);
    const [emailInput, setEmailInput] = useState('');
    const [emailSent, setEmailSent] = useState(false);
    const chatHistoryRef = useRef<ChatMessage[]>([]);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = async (userInput?: string) => {
        const text = userInput || input;
        if (!text.trim()) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            text: `> ${text}`,
            sender: 'user',
            timestamp: Date.now()
        };

        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);
        setEmotion('idle');
        setIsRateLimited(false);

        chatHistoryRef.current = [...chatHistoryRef.current, { role: 'user', content: text }];

        try {
            const response = await fetch('/api/jarvis', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ messages: chatHistoryRef.current }),
            });

            if (response.status === 429) {
                const data = await response.json();
                setIsRateLimited(true);
                const jarvisMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: `J.A.R.V.I.S is cooling down. Neural core resets in ${data.error.match(/\d+/)?.[0] || 'unknown'} minutes.`,
                    sender: 'jarvis',
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, jarvisMsg]);
                setIsThinking(false);
                return;
            }

            if (response.ok) {
                const data = await response.json();
                const responseText = data.reply;
                setRemaining(data.remaining ?? null);
                if (data.offline) {
                    chatHistoryRef.current = chatHistoryRef.current.slice(0, -1);
                } else {
                    chatHistoryRef.current = [...chatHistoryRef.current, { role: 'assistant', content: responseText }];
                }

                const jarvisMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: responseText,
                    sender: 'jarvis',
                    timestamp: Date.now()
                };

                setMessages(prev => [...prev, jarvisMsg]);
            } else {
                const fallbackText = processQueryFallback(text);
                const jarvisMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: fallbackText,
                    sender: 'jarvis',
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, jarvisMsg]);
            }
        } catch {
            const fallbackText = processQueryFallback(text);
            const jarvisMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: fallbackText,
                sender: 'jarvis',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, jarvisMsg]);
        } finally {
            setIsThinking(false);
            setEmotion(getEmotionFromText('', false));
            setTimeout(() => setEmotion('idle'), 3000);
        }
    };

    const handleEmailSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!emailInput.trim()) return;

        try {
            const response = await fetch('/api/send-demo', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: emailInput, summary: chatHistoryRef.current.map(m => m.content).join('\n') }),
            });

            if (response.ok) {
                setEmailSent(true);
                const jarvisMsg: Message = {
                    id: (Date.now() + 1).toString(),
                    text: `Email confirmed. Architecture breakdown will be sent to ${emailInput}. Expect it shortly.`,
                    sender: 'jarvis',
                    timestamp: Date.now()
                };
                setMessages(prev => [...prev, jarvisMsg]);
            }
        } catch {
            const jarvisMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: 'Email system offline. Use the SECURE COMMS button to connect directly.',
                sender: 'jarvis',
                timestamp: Date.now()
            };
            setMessages(prev => [...prev, jarvisMsg]);
        }
        setShowEmailCapture(false);
        setEmailInput('');
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div className={`border-2 p-2 flex flex-col h-full w-full gap-2 ${isRateLimited ? 'border-red-500 shadow-[0_0_15px_rgba(239,68,68,0.3)]' : 'border-green-400'}`}>
            <p className="text-yellow-400 font-bold">J.A.R.V.I.S. INTERFACE:</p>

            <div className="h-[100px] w-full flex justify-center">
                <JarvisAvatar emotion={emotion} />
            </div>

            <div className="flex-1 min-h-0">
                <div className="h-full p-1 overflow-y-auto text-xs md:text-sm border-b border-green-700 bg-black/50">
                    {messages.map((msg, index) => {
                        const isUser = msg.sender === 'user';
                        const isError = msg.text.includes('ERROR') || msg.text.includes('cooling down');
                        const textColorClass = isUser ? 'text-yellow-300' : isError ? 'text-red-400' : 'text-green-400';
                        const isLatest = index === messages.length - 1;
                        const shouldAnimate = isLatest && !isUser;

                        return (
                            <div key={msg.id} className={`mb-1 ${textColorClass}`}>
                                {shouldAnimate ? (
                                    <Typewriter
                                        text={msg.text}
                                        speed={20}
                                        onType={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                        onComplete={() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })}
                                    />
                                ) : (
                                    <span>{msg.text}</span>
                                )}
                            </div>
                        );
                    })}
                    {isThinking && <p className="text-gray-500 animate-pulse">J.A.R.V.I.S. is thinking...</p>}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* Suggested Prompts */}
            {messages.length <= 2 && (
                <div className="flex flex-wrap gap-1.5">
                    {SUGGESTED_PROMPTS.map((prompt, idx) => (
                        <button
                            key={idx}
                            onClick={() => handleSend(prompt)}
                            className="text-[9px] border border-green-800 bg-green-900/20 text-green-400 px-2 py-1 hover:bg-green-900/40 hover:border-green-500 transition-all font-mono"
                        >
                            {prompt}
                        </button>
                    ))}
                </div>
            )}

            {/* Email Capture */}
            {showEmailCapture && !emailSent && (
                <form onSubmit={handleEmailSubmit} className="flex gap-2">
                    <input
                        type="email"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        className="flex-1 bg-black border border-green-700 text-green-400 px-2 py-1 focus:outline-none focus:border-green-400 font-mono text-xs"
                        placeholder="Enter your email..."
                        required
                    />
                    <button type="submit" className="bg-green-900/30 text-green-400 border border-green-700 px-3 py-1 hover:bg-green-900/50 text-xs font-mono">
                        SEND
                    </button>
                </form>
            )}

            {emailSent && (
                <p className="text-[10px] text-green-400 font-mono">Architecture breakdown sent. Check your inbox.</p>
            )}

            {/* Input Area */}
            <div className="flex gap-2 flex-wrap">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 min-w-[200px] bg-black border border-green-700 text-green-400 px-2 py-1 focus:outline-none focus:border-green-400 font-mono text-sm"
                    placeholder="Enter command..."
                    autoFocus
                />
                <button
                    onClick={() => setShowEmailCapture(true)}
                    className="bg-yellow-900/30 text-yellow-400 border border-yellow-700 px-2 py-1 hover:bg-yellow-900/50 text-xs font-mono whitespace-nowrap shrink-0"
                >
                    DEMO
                </button>
                <button
                    onClick={() => handleSend()}
                    className="bg-green-900/30 text-green-400 border border-green-700 px-2 py-1 hover:bg-green-900/50 text-xs font-mono whitespace-nowrap shrink-0"
                >
                    SEND
                </button>
            </div>

            {/* Rate Limit Indicator */}
            {remaining !== null && !isRateLimited && (
                <p className="text-[8px] text-gray-600 font-mono text-center">
                    [{remaining} requests remaining this session]
                </p>
            )}
        </div>
    );
}