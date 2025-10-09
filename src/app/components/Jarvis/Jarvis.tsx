// components/Jarvis.tsx
'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { CARD_SYNOPSES } from '../CardGame/CardSynopses'; 

// --- Configuration ---
const ASSISTANT_NAME = "J.A.R.V.I.S";
const CORPUS_TITLES = [
    "ACHIEVEMENTS", // 0
    "EDUCATION",    // 1
    "PROJECTS",     // 2
    "EXPERIENCE",   // 3
    "BLOGSITE"      // 4
];

interface JarvisProps {
    onExit: () => void; // Function to exit the entire terminal/portfolio
}

interface LogEntry {
    type: 'user' | 'system' | 'error' | 'init';
    text: string;
}

// --- NLP Logic: Simple Keyword Matching ---
/**
 * Simulates a simple NLP process by checking keywords against the synopsis titles.
 * @param query The user's input string.
 * @returns The matching synopsis text or a "not found" error.
 */
const processQuery = (query: string): string => {
    const lowerQuery = query.toLowerCase();

    // 1. Check for basic commands
    if (lowerQuery === 'help' || lowerQuery === 'commands') {
        return "COMMANDS AVAILABLE:\n" +
               " - 'STATUS' or 'SYSTEM INFO'\n" +
               " - 'HELP' or 'COMMANDS'\n" +
               " - Query topics: Try keywords like 'ACHIEVEMENTS', 'EDUCATION', 'PROJECTS', 'EXPERIENCE', or 'BLOG'.";
    }

    if (lowerQuery.includes('status') || lowerQuery.includes('system info')) {
        return "STATUS: Core Systems Online. Data Corpus Size: 5 Segments. Type 'help' for commands.";
    }
    
    // 2. Check for Corpus Matches
    for (let i = 0; i < CORPUS_TITLES.length; i++) {
        const title = CORPUS_TITLES[i].toLowerCase();
        
        // Match if the query contains the keyword (e.g., 'tell me about projects' -> 'projects')
        if (lowerQuery.includes(title) || (title === 'blogsite' && lowerQuery.includes('blog'))) {
            const synopsis = CARD_SYNOPSES[i];
            return `RETRIEVING DATA: ${synopsis.replace(/\n/g, ' | ')}`; // Format for single-line terminal view
        }
    }

    // 3. Default Error/Not Found
    return "ERROR: Query not understood. The data corpus does not contain sufficient information for that subject. Try 'help'.";
};


export default function Jarvis({ onExit }: JarvisProps) {
    const [input, setInput] = useState('');
    const [log, setLog] = useState<LogEntry[]>([]);
    const logEndRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to the bottom of the log
    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [log]);

    // Initial system boot log
    useEffect(() => {
        setLog([
            { type: 'init', text: `[SYSTEM BOOT] ${ASSISTANT_NAME} v3.1.2 initiated.` },
            { type: 'init', text: 'Initializing NLP Core... Complete.' },
            { type: 'system', text: `Welcome. I am ${ASSISTANT_NAME}. Type 'help' to begin.` },
        ]);
    }, []);

    const handleCommand = useCallback((command: string) => {
        const trimmedCommand = command.trim();
        if (!trimmedCommand) return;

        // 1. Add user command to log
        setLog(prev => [...prev, { type: 'user', text: `> ${trimmedCommand}` }]);
        setInput('');

        // 2. Check for the hard-coded exit command
        if (trimmedCommand.toLowerCase() === 'exit') {
            setLog(prev => [...prev, { type: 'system', text: "SHUTDOWN INITIATED: Terminating core systems..." }]);
            setTimeout(onExit, 1000); // Wait 1 second before calling the parent's exit
            return;
        }

        // 3. Process the NLP query
        const response = processQuery(trimmedCommand);

        // 4. Add system response to log
        setTimeout(() => {
            setLog(prev => [...prev, { type: 'system', text: `${ASSISTANT_NAME}: ${response}` }]);
        }, 500); // Small delay for effect

    }, [onExit]);

    const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleCommand(input);
        }
    };

    return (
        <div className="flex flex-col h-full w-full p-2 bg-black font-mono text-sm">
            
            {/* Header/Control Panel */}
            <div className="flex justify-between items-center pb-2 border-b border-green-700">
                <h2 className="text-xl text-blue-400 font-bold">{ASSISTANT_NAME} NLP CONSOLE</h2>
                <button 
                    onClick={() => handleCommand('exit')} 
                    className="px-3 py-1 text-xs text-red-400 hover:text-red-200 border border-red-400 transition-colors"
                >
                    [X] TERMINATE
                </button>
            </div>

            {/* Terminal Log Output */}
            <div className="flex-grow overflow-y-auto mt-2 mb-2 p-1 bg-gray-900/50 rounded shadow-inner">
                {log.map((entry, index) => (
                    <div 
                        key={index} 
                        className={`py-0.5 ${
                            entry.type === 'user' ? 'text-green-500' : 
                            entry.type === 'system' ? 'text-yellow-400' : 
                            entry.type === 'init' ? 'text-gray-500' : 
                            'text-red-400'
                        }`}
                    >
                        {entry.text}
                    </div>
                ))}
                <div ref={logEndRef} />
            </div>

            {/* Command Input */}
            <div className="flex items-center border-t border-green-700 pt-2">
                <span className="text-green-400 mr-2">{ASSISTANT_NAME}@user:~$</span>
                <input
                    type="text"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-grow bg-transparent text-white focus:outline-none placeholder-gray-500"
                    placeholder="Enter command or query (e.g., 'projects', 'help', 'exit')"
                    autoFocus
                />
            </div>
        </div>
    );
}