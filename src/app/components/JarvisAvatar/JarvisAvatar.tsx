// components/JarvisAvatar/JarvisAvatar.tsx
'use client';

import React, { useEffect, useState } from 'react';

// --- Configuration ---
// Define the grid size of the spritesheet
const SPRITESHEET_COLS = 8;
const SPRITESHEET_ROWS = 7; 

// 🎯 FINAL DIMENSIONS: 75px for both width and height.
const SPRITE_WIDTH_PX = 215; 
const SPRITE_HEIGHT_PX = 100; 

// 💡 MANUAL PIXEL OFFSETS (Keep these for alignment, fine-tune as needed)
const OFFSET_X_PX = 0; 
const OFFSET_Y_PX = -35; 


// --- State Definitions ---
// 💡 UPDATED: Only 'idle' and 'talking' are active states now
export type JarvisEmotion = 'idle' | 'talking';

// Map emotion to a specific sprite sheet row or animation frame sequence
// Coordinates are (col, row) where (0, 0) is top-left
const EMOTION_FRAMES: { [key in JarvisEmotion]: { row: number, startCol: number, endCol: number } } = {
    // 💡 UPDATED: Idle is now an animation: Row 0, Frames 0, 1, 2 (0-2)
    idle: { row: 0, startCol: 0, endCol: 2 }, 

    // 💡 UPDATED: Talking animation: Row 1, Frames 4, 5, 6, 7 (4-7)
    talking: { row: 1, startCol: 4, endCol: 7 }, 
    
    // Note: Since both are now animations, the type definition for EMOTION_FRAMES
    // has been simplified to remove the 'number[] |' union.
};

// Animation speed in milliseconds
const ANIMATION_INTERVAL = 150; 

interface JarvisAvatarProps {
    emotion?: JarvisEmotion;
}

export default function JarvisAvatar({ emotion = 'idle' }: JarvisAvatarProps) { 
    const [currentFrame, setCurrentFrame] = useState(0);

    // If emotion is not found (shouldn't happen with the default)
    const frameConfig = EMOTION_FRAMES[emotion] || EMOTION_FRAMES.idle;
    
    // 💡 SIMPLIFIED: isAnimation is always true now since all remaining states are animations
    const isAnimation = true; 

    useEffect(() => {
        // Now that all states are animations, we no longer need the if (!isAnimation) check.
        
        // Animated sequence: set up interval
        // We cast frameConfig as the animation object structure, since it is guaranteed to be one.
        const { row, startCol, endCol } = frameConfig as { row: number, startCol: number, endCol: number };
        const frameCount = endCol - startCol + 1;

        // Reset frame state when emotion changes
        setCurrentFrame(startCol); 

        const intervalId = setInterval(() => {
            setCurrentFrame(prevFrame => {
                const nextCol = (prevFrame - startCol + 1) % frameCount + startCol;
                return nextCol;
            });
        }, ANIMATION_INTERVAL);

        return () => clearInterval(intervalId);
    }, [emotion, frameConfig]); // Removed isAnimation from dependency array

    
    // 💡 SIMPLIFIED: Background position calculation no longer needs ternary operators
    // Since we are always animating, 'col' is always 'currentFrame' and 'row' is always 'frameConfig.row'.
    const { row: animatedRow } = frameConfig as { row: number, startCol: number, endCol: number };

    let col = currentFrame;
    let row = animatedRow;

    // Ensure col and row are within bounds for safety
    col = col % SPRITESHEET_COLS;
    row = row % SPRITESHEET_ROWS;

    const backgroundX = (-col * SPRITE_WIDTH_PX) - OFFSET_X_PX;
    const backgroundY = (-row * SPRITE_HEIGHT_PX) - OFFSET_Y_PX;

    return (
        <div 
            className="jarvis-avatar w-20 h-20" 
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                // Outer div (Viewport) uses 75x75 dimensions
                width: `${SPRITE_WIDTH_PX}px`, 
                height: `${SPRITE_HEIGHT_PX}px`,
                overflow: 'hidden',
            }}
        >
            <div
                style={{
                    // Inner div (Spritesheet) uses 8 columns * 75px wide, 7 rows * 75px high
                    width: `${SPRITESHEET_COLS * SPRITE_WIDTH_PX}px`,
                    height: `${SPRITESHEET_ROWS * SPRITE_HEIGHT_PX}px`,
                    backgroundImage: `url('images/robot_spritesheet.jpg')`, 
                    backgroundSize: `${SPRITESHEET_COLS * SPRITE_WIDTH_PX}px ${SPRITESHEET_ROWS * SPRITE_HEIGHT_PX}px`,
                    backgroundPosition: `${backgroundX}px ${backgroundY}px`,
                    transition: 'none', // Transition is now always 'none' for frame-by-frame animation
                }}
            />
        </div>
    );
}