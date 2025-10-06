// components/WindowsStartupAudio/WindowsStartupAudio.tsx
'use client';

import { useEffect, useRef } from 'react';

// 🛑 IMPORTANT: Put your audio file at /public/audio/windows_startup.mp3 🛑
const AUDIO_SRC = '/audio/windows_startup.mp4';

export default function WindowsStartupAudio() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = audioRef.current;
    
    if (audio) {
      // Play the sound immediately when the component mounts
      audio.play().catch(error => {
        console.warn("Windows startup audio failed to play (user interaction required):", error);
      });
      // Cleanup is not strictly necessary here since the component unmounts
    }
  }, []);

  return (
    // The audio element is hidden, only used for playback
    <audio ref={audioRef} src={AUDIO_SRC} preload="auto" hidden />
  );
}