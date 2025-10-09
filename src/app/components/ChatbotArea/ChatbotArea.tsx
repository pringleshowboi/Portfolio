// components/ChatbotArea/ChatbotArea.tsx
'use client';

import { useState, useEffect, useRef } from 'react';
import JarvisAvatar, { JarvisEmotion } from '../JarvisAvatar/JarvisAvatar';
// Assuming the CardSynopses file is located here:
// NOTE: You must ensure this file exists and exports CARD_SYNOPSES
import { CARD_SYNOPSES } from '../CardGame/CardSynopses'; 

// --- Configuration ---
const ASSISTANT_NAME = "J.A.R.V.I.S";
const initialMessage = "Hello, I am J.A.R.V.I.S., an Interactive Interface designed to assist in your portfolio access.";
const NLP_PROCESSING_DELAY_MS = 1500; // Delay for complex NLP queries

// NLP Corpus Titles
const CORPUS_TITLES = [
    "ACHIEVEMENTS", "EDUCATION", "PROJECTS", "EXPERIENCE", "BLOGSITE"
];

interface ChatbotAreaProps {
    status: string;
    currentTime: string;
}

// --- CORE LOGIC FUNCTIONS ---
const getEmotionFromText = (text: string, isThinkingNow: boolean): JarvisEmotion => {
    const lowerText = text.toLowerCase();
    
    // FIX: Replaced 'thinking' with 'listening' as 'thinking' is likely missing from JarvisEmotion type.
    // The handleSend function already explicitly sets emotion to 'thinking' when required.
    if (isThinkingNow) return 'listening'; // Return a valid emotion type if thinking is active

    if (lowerText.includes('error') || lowerText.includes('not recognized')) return 'sad';
    if (lowerText.includes('success') || lowerText.includes('nominal') || lowerText.includes('retrieving data')) return 'active';
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('assist')) return 'talking';
    
    return 'talking'; 
};

const getQuickResponse = (lowerText: string, status: string): string | null => {
    if (lowerText.includes('hello') || lowerText.includes('hi')) {
        return `Greeting Protocol: Acknowledged. How may I assist you today?`;
    }
    if (lowerText.includes('who are you') || lowerText.includes('what are you')) {
        return "I am J.A.R.V.I.S., an Interactive Interface designed to assist in your portfolio access.";
    }
    if (lowerText.includes('status') || lowerText.includes('system')) {
        return `Current system status is: ${status}. All core protocols are nominal.`;
    }
    if (lowerText.includes('contact')) {
        return "Contact protocols are reserved. Please achieve DATA RETRIEVAL COMPLETE status first.";
    }
    return null;
}

const processQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery === 'help' || lowerQuery === 'commands') {
        return "COMMANDS AVAILABLE:\n - Query topics: Try keywords like 'ACHIEVEMENTS', 'EDUCATION', 'PROJECTS', 'EXPERIENCE', or 'BLOG'.\n - Ask 'who are you', 'status', 'cards.exe', or 'contact'.";
    }
    
    if (lowerQuery.includes('cards.exe') || lowerQuery.includes('game')) {
        return "SYSTEM MESSAGE: Cards.exe is a 3D data retrieval utility. Access it from the main desktop interface to begin collecting data fragments. It cannot be launched from this console.";
    }

    for (let i = 0; i < CORPUS_TITLES.length; i++) {
        const title = CORPUS_TITLES[i].toLowerCase();
        if (lowerQuery.includes(title) || (title === 'blogsite' && lowerQuery.includes('blog'))) {
            const synopsis = CARD_SYNOPSES[i];
            const formattedSynopsis = synopsis.replace(/\n/g, ' | ').replace(/- /g, '> '); 
            return `SUCCESS: RETRIEVING DATA FRAGMENT: ${formattedSynopsis}`;
        }
    }
    
    return "ERROR: Query not recognized or insufficient data in the corpus. Try 'help'.";
};
// --------------------------------------------------------------------------


export default function ChatbotArea({ status, currentTime }: ChatbotAreaProps) {
    const [messages, setMessages] = useState<string[]>([initialMessage]);
    const [input, setInput] = useState('');
    const [emotion, setEmotion] = useState<JarvisEmotion>('idle');
    const [isThinking, setIsThinking] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    // --- Core Handler ---
    const handleSend = async () => {
        if (!input.trim() || isThinking) return;

        const userMessage = input.trim();
        const lowerMessage = userMessage.toLowerCase();
        setMessages(prev => [...prev, `> ${userMessage}`]);
        setInput('');
        
        const quickResponse = getQuickResponse(lowerMessage, status);

        if (quickResponse) {
            setMessages(prev => [...prev, `${ASSISTANT_NAME}: ${quickResponse}`]);
            // Use the corrected function (which will return 'listening' or another valid type)
            setEmotion(getEmotionFromText(quickResponse, false)); 
            setTimeout(() => setEmotion('listening'), 3000);
            return;
        }

        setIsThinking(true);
        setEmotion('active'); // Use a known valid emotion, as 'thinking' is the source of the type error

        await new Promise(resolve => setTimeout(resolve, NLP_PROCESSING_DELAY_MS));

        const jarvisResponse = processQuery(userMessage);
        
        setIsThinking(false);
        setMessages(prev => [...prev, `${ASSISTANT_NAME}: ${jarvisResponse}`]);
        setEmotion(getEmotionFromText(jarvisResponse, false));
        
        setTimeout(() => setEmotion('listening'), 3000);
    };

    // Effects
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setEmotion('talking');
        setTimeout(() => setEmotion('listening'), 2000);
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div 
            // SCROLLING FIX: Add min-h-0 to the component's root to prevent it from overflowing its grid cell
            className="border-2 border-green-400 p-2 flex flex-col justify-end h-full w-full min-h-0"
            style={{ gridArea: 'chatbot' }}
        >
            <p className="text-yellow-400 font-bold mb-2">J.A.R.V.I.S. INTERFACE:</p>
            
            {/* 1. Spritesheet Avatar Area (Fixed Height) */}
            <div className="h-[120px] w-full flex justify-center mb-4">
                <JarvisAvatar emotion={emotion} /> 
            </div>

            {/* 2. Chat Log Wrapper - This area handles the internal scroll effect */}
            <div className="flex-grow flex flex-col min-h-0"> 
                <div 
                    className="flex-grow p-1 overflow-y-auto text-sm border-b border-green-700 bg-black/50 mb-2"
                > 
                    {messages.map((msg, index) => (
                        <p 
                            key={index} 
                            className={
                                msg.startsWith('>') 
                                    ? 'text-yellow-300' 
                                    : msg.includes('SUCCESS') 
                                        ? 'text-green-300' 
                                        : msg.includes('ERROR') 
                                            ? 'text-red-400'
                                            : 'text-green-400'
                            }
                        >
                            {msg}
                        </p>
                    ))}
                    {isThinking && <p className="text-gray-500 animate-pulse">J.A.R.V.I.S. is thinking...</p>}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* 3. Input Area */}
            <div className="p-1 flex items-center">
                <span className="text-green-400">$: </span>
                <input
                    type="text"
                    className="flex-grow bg-transparent text-green-400 border-none outline-none ml-2"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setEmotion('listening');
                    }}
                    onKeyDown={handleKeyPress}
                    disabled={isThinking}
                />
            </div>
            
            <div className="flex justify-between items-center text-sm mt-2">
                <p className="text-yellow-400 font-bold">STATUS:</p>
                <p className="text-sm text-green-500 font-bold">{status}</p>
            </div>
            {/* FIX: Conditional check to prevent slice() error on initial render */}
            <p className="text-xs mt-1 text-gray-500 text-right">
                LAST PING: {currentTime ? currentTime.slice(0, 8) : '00:00:00'} 
            </p>
        </div>
    );
}