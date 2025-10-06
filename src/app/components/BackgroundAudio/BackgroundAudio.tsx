'use client';

import { RefObject } from 'react';

// 🚨 UPDATED PATH 🚨
const AUDIO_FILE_PATH = "/audio/basement-dweller.mp3";
 // 

interface BackgroundMusicProps {
  audioRef: RefObject<HTMLAudioElement | null >;
}

export default function BackgroundAudio({ audioRef }: BackgroundMusicProps) {
  return (
    <audio 
      ref={audioRef} 
      src={AUDIO_FILE_PATH} 
      preload="auto" 
      loop
      style={{ display: 'none' }} 
    />
  );
}

