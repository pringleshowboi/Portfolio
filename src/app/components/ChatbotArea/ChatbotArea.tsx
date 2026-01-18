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
    
    // FIX: Replaced all invalid emotion types ('listening', 'thinking', 'sad', 'active')
    // with either 'idle' or 'talking'.
    if (isThinkingNow) return 'idle'; // Fallback to a valid, resting state

    // Error responses will result in the 'talking' emotion.
    if (lowerText.includes('error') || lowerText.includes('not recognized')) return 'talking'; 
    
    // Success responses will result in the 'talking' emotion.
    if (lowerText.includes('success') || lowerText.includes('nominal') || lowerText.includes('retrieving data')) return 'talking';
    
    // General greeting/assist responses will result in the 'talking' emotion.
    if (lowerText.includes('hello') || lowerText.includes('hi') || lowerText.includes('assist')) return 'talking';
    
    return 'talking'; // Default to talking if no specific condition met
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
        return "Contact sequence: Use the CALL TO DISCUSS A WEBSITE button in the services panel to start a direct call.";
    }
    if (lowerText.includes('pricing') || lowerText.includes('price') || lowerText.includes('packages') || lowerText.includes('services')) {
        return "Pricing summary: Open the WEB_DEV.DASH terminal panel to view Launch Pad, Growth Ready, and Custom Experience website packages, then call directly from the highlighted button.";
    }
    return null;
}

const processQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    if (lowerQuery === 'help' || lowerQuery === 'commands') {
        return [
            "COMMANDS AVAILABLE:",
            "- Ask about topics: 'ACHIEVEMENTS', 'EDUCATION', 'PROJECTS', 'EXPERIENCE', or 'BLOG'.",
            "- Ask 'pricing' or 'services' to view website packages.",
            "- Ask 'who are you', 'status', 'cards.exe', or 'contact'."
        ].join("\n");
    }
    
    if (lowerQuery.includes('cards.exe') || lowerQuery.includes('game')) {
        return "SYSTEM MESSAGE: cards.exe is the interactive 3D portfolio game. Launch it from the ACCESS PORT panel on the desktop.";
    }

    if (lowerQuery.includes('pricing') || lowerQuery.includes('services') || lowerQuery.includes('packages')) {
        return "SERVICE SUMMARY: Open WEB_DEV.DASH in the terminal panel to view Launch Pad, Growth Ready, and Custom Experience packages, then use the call button to discuss a project.";
    }

    for (let i = 0; i < CORPUS_TITLES.length; i++) {
        const title = CORPUS_TITLES[i].toLowerCase();
        if (lowerQuery.includes(title) || (title === 'blogsite' && lowerQuery.includes('blog'))) {
            const synopsis = CARD_SYNOPSES[i];
            const formattedSynopsis = synopsis.replace(/\n/g, " | ").replace(/- /g, "> "); 
            return `SUCCESS: RETRIEVING DATA FRAGMENT: ${formattedSynopsis}`;
        }
    }
    
    return "ERROR: Query not recognized or insufficient data in the corpus. Try 'help' for available commands.";
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
            setEmotion(getEmotionFromText(quickResponse, false)); 
            // Reset to idle after a response.
            setTimeout(() => setEmotion('idle'), 3000); 
            return;
        }

        setIsThinking(true);
        // FIX: 'idle' is the most appropriate valid emotion for a 'thinking' state.
        setEmotion('idle'); 

        await new Promise(resolve => setTimeout(resolve, NLP_PROCESSING_DELAY_MS));

        const jarvisResponse = processQuery(userMessage);
        
        setIsThinking(false);
        setMessages(prev => [...prev, `${ASSISTANT_NAME}: ${jarvisResponse}`]);
        setEmotion(getEmotionFromText(jarvisResponse, false));
        
        // Reset to idle after a response.
        setTimeout(() => setEmotion('idle'), 3000); 
    };

    // Effects
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    useEffect(() => {
        setEmotion('talking');
        // Reset to idle after initial greeting.
        setTimeout(() => setEmotion('idle'), 2000); 
    }, []);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSend();
        }
    };

    return (
        <div 
            className="border-2 border-green-400 p-2 flex flex-col h-full w-full gap-2"
            style={{ gridArea: 'chatbot' }}
        >
            <p className="text-yellow-400 font-bold">J.A.R.V.I.S. INTERFACE:</p>
            
            <div className="h-[120px] w-full flex justify-center">
                <JarvisAvatar emotion={emotion} /> 
            </div>

            <div className="flex-1 min-h-0">
                <div 
                    className="h-full p-1 overflow-y-auto text-xs md:text-sm border-b border-green-700 bg-black/50"
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

            <div className="p-1 flex items-center">
                <span className="text-green-400">$:</span>
                <input
                    type="text"
                    className="flex-grow bg-transparent text-green-400 border-none outline-none ml-2 text-xs md:text-sm"
                    value={input}
                    onChange={(e) => {
                        setInput(e.target.value);
                        setEmotion('idle');
                    }}
                    onKeyDown={handleKeyPress}
                    disabled={isThinking}
                />
            </div>
            
            <div className="flex justify-between items-center text-xs md:text-sm">
                <p className="text-yellow-400 font-bold">STATUS:</p>
                <p className="text-green-500 font-bold">{status}</p>
            </div>
            <p className="text-[10px] md:text-xs text-gray-500 text-right">
                LAST PING: {currentTime ? currentTime.slice(0, 8) : "00:00:00"} 
            </p>
        </div>
    );
}
