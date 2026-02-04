// components/ChatbotArea/ChatbotArea.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import JarvisAvatar, { JarvisEmotion } from '../JarvisAvatar/JarvisAvatar';
import { CARD_SYNOPSES } from '../CardGame/CardSynopses'; 
import Typewriter from '../Typewriter/Typewriter';

// --- Configuration ---
// const ASSISTANT_NAME = "J.A.R.V.I.S";
const initialMessageText = "Hello, I am J.A.R.V.I.S., an Interactive Interface designed to assist in your secure digital transformation.";
const NLP_PROCESSING_DELAY_MS = 1500; // Delay for complex NLP queries

interface Message {
    id: string;
    text: string;
    sender: 'user' | 'jarvis';
    timestamp: number;
}

// NLP Corpus Titles
const CORPUS_TITLES = [
    "PROPOSITION",  // 0. Secure-First Proposition
    "SERVICES",     // 1. Core Services (MVP)
    "DATA",         // 2. Data & Automation
    "WEB",          // 3. Web Strategy & Managed IT
    "FUTURE"        // 4. Emerging Tech & GRC
];

interface ChatbotAreaProps {
    status: string;
    currentTime: string;
}

// --- CORE LOGIC FUNCTIONS ---
const getEmotionFromText = (text: string, isThinkingNow: boolean): JarvisEmotion => {
    const lowerText = text.toLowerCase();
    
    if (isThinkingNow) return 'idle'; 

    if (lowerText.includes('error') || lowerText.includes('not recognized')) return 'talking'; 
    if (lowerText.includes('success') || lowerText.includes('nominal') || lowerText.includes('retrieving data')) return 'talking';
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('assist')) return 'talking';
    
    return 'talking'; 
};

const processQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery === 'help' || lowerQuery === 'commands') {
        return [
            "COMMANDS AVAILABLE:",
            "- Ask about: 'PROPOSITION', 'SERVICES', 'DATA', 'WEB', or 'FUTURE'.",
            "- Ask 'pricing' to view engagement models.",
            "- Ask 'book call' to schedule a discovery meeting.",
            "- Ask 'status' or 'cards.exe'."
        ].join("\n");
    }
    
    if (lowerQuery.includes('cards.exe') || lowerQuery.includes('game')) {
        return "SYSTEM MESSAGE: cards.exe is the interactive 3D service explorer. Launch it from the ACCESS PORT panel.";
    }

    if (lowerQuery.includes('pricing') || lowerQuery.includes('packages')) {
        return "ENGAGEMENT SUMMARY: Open WEB_DEV.DASH in the terminal panel to view Pilot & Retainer options.";
    }

    // 🛑 NEW TRIGGER: Discovery Call / Booking
    if (lowerQuery.includes('book') || lowerQuery.includes('call') || lowerQuery.includes('discovery') || lowerQuery.includes('meeting') || lowerQuery.includes('contact')) {
        return "INITIATING SECURE HANDSHAKE...\n" +
               "Link Generated: [BOOK DISCOVERY CALL](https://calendly.com/your-booking-link)\n" +
               "STATUS: Ready to schedule 30-min strategy session.";
    }

    for (let i = 0; i < CORPUS_TITLES.length; i++) {
        const title = CORPUS_TITLES[i].toLowerCase();
        // Match if query contains title, OR special handling for specific synonyms
        let match = lowerQuery.includes(title);
        
        if (!match) {
            // Synonyms mapping
            if (title === 'proposition' && (lowerQuery.includes('secure') || lowerQuery.includes('value'))) match = true;
            if (title === 'services' && (lowerQuery.includes('cybersecurity') || lowerQuery.includes('design'))) match = true;
            if (title === 'data' && (lowerQuery.includes('analytics') || lowerQuery.includes('automation'))) match = true;
            if (title === 'web' && (lowerQuery.includes('strategy') || lowerQuery.includes('managed') || lowerQuery.includes('it'))) match = true;
            if (title === 'future' && (lowerQuery.includes('compliance') || lowerQuery.includes('tech'))) match = true;
        }

        if (match) {
            const synopsis = CARD_SYNOPSES[i];
            const formattedSynopsis = synopsis.replace(/\n/g, " | ").replace(/- /g, "> "); 
            return `SUCCESS: RETRIEVING DATA FRAGMENT: ${formattedSynopsis}`;
        }
    }
    
    return "ERROR: Query not recognized. Try 'help' for available commands.";
};

// --------------------------------------------------------------------------


export default function ChatbotArea({}: ChatbotAreaProps) {
    const [messages, setMessages] = useState<Message[]>([
        { id: 'init', text: initialMessageText, sender: 'jarvis', timestamp: Date.now() }
    ]);
    const [input, setInput] = useState('');
    const [emotion, setEmotion] = useState<JarvisEmotion>('idle');
    const [isThinking, setIsThinking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isThinking]);

    const handleSend = () => {
        if (!input.trim()) return;

        const userMsg: Message = { 
            id: Date.now().toString(), 
            text: `> ${input}`, 
            sender: 'user', 
            timestamp: Date.now() 
        };
        
        setMessages(prev => [...prev, userMsg]);
        setInput('');
        setIsThinking(true);
        setEmotion('idle'); // Thinking face?

        // Simulate network/processing delay
        setTimeout(() => {
            const responseText = processQuery(input); // Note: using closure 'input' value which is fine here? No, 'input' is cleared.
            // Actually input is cleared in state but the closure captures the value? 
            // Wait, handleSend is a closure. 'input' refers to the state at the time handleSend was called.
            // Yes, standard React closure behavior. 'input' here is the string value at the moment of click.
            
            const jarvisMsg: Message = {
                id: (Date.now() + 1).toString(),
                text: responseText,
                sender: 'jarvis',
                timestamp: Date.now()
            };

            setMessages(prev => [...prev, jarvisMsg]);
            setIsThinking(false);
            setEmotion(getEmotionFromText(responseText, false));
            
            // Reset emotion to idle after a few seconds of "talking"
            setTimeout(() => setEmotion('idle'), 3000);

        }, NLP_PROCESSING_DELAY_MS);
    };

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div 
            className="border-2 border-green-400 p-2 flex flex-col h-full w-full gap-2"
        >
            <p className="text-yellow-400 font-bold">J.A.R.V.I.S. INTERFACE:</p>
            
            <div className="h-[120px] w-full flex justify-center">
                <JarvisAvatar emotion={emotion} /> 
            </div>

            <div className="flex-1 min-h-0">
                <div 
                    className="h-full p-1 overflow-y-auto text-xs md:text-sm border-b border-green-700 bg-black/50"
                > 
                    {messages.map((msg, index) => {
                        // Determine styling based on content
                        const isUser = msg.sender === 'user';
                        const isSuccess = msg.text.includes('SUCCESS');
                        const isError = msg.text.includes('ERROR');
                        
                        const textColorClass = isUser 
                            ? 'text-yellow-300' 
                            : isSuccess 
                                ? 'text-green-300' 
                                : isError 
                                    ? 'text-red-400'
                                    : 'text-green-400';

                        // Check if this is the latest message AND it's from Jarvis
                        // If so, use Typewriter. Otherwise, static text.
                        // Actually, 'init' message should probably just be static to avoid re-typing on refresh?
                        // But user might like it. Let's animate only if it's the very last one.
                        const isLatest = index === messages.length - 1;
                        const shouldAnimate = isLatest && !isUser;

                        return (
                            <div key={msg.id} className={`mb-1 ${textColorClass}`}>
                                {shouldAnimate ? (
                                    <Typewriter 
                                        text={msg.text} 
                                        speed={20} 
                                        onType={() => {
                                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
                                        onComplete={() => {
                                            // Optional: trigger scroll again on complete?
                                            messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
                                        }}
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

            <div className="flex gap-2">
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyPress}
                    className="flex-1 bg-black border border-green-700 text-green-400 px-2 py-1 focus:outline-none focus:border-green-400 font-mono text-sm"
                    placeholder="Enter command..."
                    autoFocus
                />
                <button 
                    onClick={handleSend}
                    className="bg-green-900/30 text-green-400 border border-green-700 px-3 py-1 hover:bg-green-900/50 text-sm"
                >
                    SEND
                </button>
            </div>
        </div>
    );
}
