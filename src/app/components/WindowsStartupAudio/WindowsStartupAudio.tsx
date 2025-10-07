// components/WindowsStartupAudio/WindowsStartupAudio.tsx
'use client';

import { useEffect, useRef } from 'react';

// 🛑 IMPORTANT: Confirm the file extension in your /public/audio folder. 
// Assuming it's MP4 based on your code, but often Windows startup sounds are MP3/WAV.
const AUDIO_SRC = '/audio/windows_startup.mp4';

export default function WindowsStartupAudio() {
    // FIX: Add explicit null type to useRef for correct initialization
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        const audio = audioRef.current;
        
        if (audio) {
            // Play the sound immediately when the component mounts
            audio.play().catch(error => {
                console.warn("Windows startup audio failed to play (user interaction required):", error);
            });
        }
    }, []);

    return (
        // The audio element is hidden, only used for playback
        <audio ref={audioRef} src={AUDIO_SRC} preload="auto" hidden />
    );
}