'use client';

import { RefObject } from 'react';

// 🚨 UPDATED PATH 🚨
<<<<<<< HEAD
const AUDIO_FILE_PATH = "/audio/basement-dweller.mp3"; "/audio/basement-dweller.mp3";
 //  
=======
const AUDIO_FILE_PATH = "/audio/basement-dweller.mp3"; 
>>>>>>> 6247f0f

interface BackgroundMusicProps {
  audioRef: RefObject<HTMLAudioElement>;
}

export default function BackgroundAudio({ audioRef }: BackgroundMusicProps) {
  return (
    <audio 
      ref={audioRef} 
      src={AUDIO_FILE_PATH} 
      preload="auto" 
<<<<<<< HEAD
      loop
=======
      loop 
>>>>>>> 6247f0f
      style={{ display: 'none' }} 
    />
  );
}

