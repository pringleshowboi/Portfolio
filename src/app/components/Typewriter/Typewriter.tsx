'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterProps {
  text: string;
  speed?: number;
  startDelay?: number;
  onComplete?: () => void;
  onType?: () => void;
  className?: string;
  cursorClassName?: string;
}

export default function Typewriter({
  text,
  speed = 30,
  startDelay = 0,
  onComplete,
  onType,
  className = "",
  cursorClassName = "inline-block w-2 h-4 bg-green-400 ml-1 align-middle"
}: TypewriterProps) {
  const [displayedText, setDisplayedText] = useState('');
  const [isStarted, setIsStarted] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  // Refs for callbacks to avoid re-triggering effects when they change
  const onTypeRef = useRef(onType);
  const onCompleteRef = useRef(onComplete);

  useEffect(() => {
    onTypeRef.current = onType;
    onCompleteRef.current = onComplete;
  }, [onType, onComplete]);

  useEffect(() => {
    // Reset state when text changes
    setDisplayedText('');
    setIsStarted(false);
    setIsComplete(false);

    const startTimeout = setTimeout(() => {
      setIsStarted(true);
    }, startDelay);

    return () => clearTimeout(startTimeout);
  }, [text, startDelay]);

  useEffect(() => {
    if (!isStarted) return;

    let currentIndex = 0;
    const intervalId = setInterval(() => {
      if (currentIndex >= text.length) {
        clearInterval(intervalId);
        setIsComplete(true);
        if (onCompleteRef.current) onCompleteRef.current();
        return;
      }

      setDisplayedText(text.slice(0, currentIndex + 1));
      if (onTypeRef.current) onTypeRef.current();
      currentIndex++;
    }, speed);

    return () => clearInterval(intervalId);
  }, [isStarted, text, speed]);

  return (
    <span className={className}>
      {displayedText}
      {!isComplete && (
        <motion.span
          className={cursorClassName}
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity, repeatType: 'reverse' }}
        />
      )}
    </span>
  );
}
