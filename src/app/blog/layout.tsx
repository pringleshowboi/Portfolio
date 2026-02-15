// src/app/blog/layout.tsx
import React from 'react';
import Link from 'next/link';

// This applies the terminal shell styles to everything under /blog
export default function BlogLayout({ children }: { children: React.ReactNode }) {
  return (
    <div 
      // Core styling: Black background, monospace font, green text, padding
      className="min-h-screen bg-black/90 font-mono text-green-400 p-8"
    >
      <header className="border-b-4 border-green-400 pb-2 mb-6 flex justify-between items-end">
        <div>
          <h1 className="text-yellow-400 text-4xl font-extrabold tracking-wider">
            {`C:\\BLOG.EXE`}
          </h1>
          <p className="text-sm mt-1">
            {`// Secure Launchpad Data Stream`}
          </p>
        </div>
        <Link 
          href="/" 
          className="mb-1 text-xs md:text-sm bg-red-900/30 border border-red-500 text-red-400 px-3 py-1 hover:bg-red-900/50 hover:text-red-300 transition-colors uppercase font-bold"
        >
          [ ← RETURN_TO_TERMINAL ]
        </Link>
      </header>
      
      <main className="max-w-4xl mx-auto">
        {children}
      </main>
      
    </div>
  );
}