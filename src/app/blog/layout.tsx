// src/app/blog/layout.tsx
import React from 'react';

// This applies the terminal shell styles to everything under /blog
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      // Core styling: Black background, monospace font, green text, padding
      className="min-h-screen bg-black/90 font-mono text-green-400 p-8"
    >
      <header className="border-b-4 border-green-400 pb-2 mb-6">
        <h1 className="text-yellow-400 text-4xl font-extrabold tracking-wider">
          {`C:\\BLOG.EXE`}
        </h1>
        <p className="text-sm mt-1">
          {`// Secure Launchpad Data Stream`}
        </p>
      </header>
      
      <main className="max-w-4xl mx-auto">
        {children}
      </main>
      
    </div>
  );
}