// components/Jarvis.tsx
'use client';

import React from 'react';

// --- Configuration ---
// This component appears to be a legacy or alternative interface.
// The main interface is now handled by ChatbotArea.tsx

interface JarvisProps {
    onExit: () => void; 
}

export default function Jarvis({ onExit }: JarvisProps) {
    return (
        <div className="flex flex-col items-center justify-center h-full text-green-500 font-mono">
            <h1 className="text-2xl font-bold mb-4">SECURE-FIRST SYSTEMS ONLINE</h1>
            <p className="mb-8">Access via Main Terminal</p>
            <button 
                onClick={onExit}
                className="px-4 py-2 border border-green-500 hover:bg-green-900/50"
            >
                EXIT
            </button>
        </div>
    );
}
