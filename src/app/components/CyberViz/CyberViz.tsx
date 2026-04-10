'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// Neutral/positive system events for the landing page
const SYSTEM_EVENTS = [
    "SYSTEM INTEGRITY: VERIFIED",
    "ALL NODES: SECURE",
    "AI AGENT: ONLINE",
    "ZERO TRUST POLICY: ACTIVE",
    "ENCRYPTION: AES-256-GCM",
    "NETWORK LATENCY: 12ms",
    "UPTIME: 99.99%",
    "BACKUP STATUS: SYNCHRONIZED",
    "CERTIFICATES: VALID",
    "FIREWALL RULES: UPDATED",
    "AUTH TOKENS: REFRESHED",
    "DATABASE REPLICATION: HEALTHY",
    "LOAD BALANCER: OPTIMAL",
    "CDN CACHE: WARM",
    "API GATEWAY: STABLE",
];

interface SystemNode {
    id: string;
    x: number;
    y: number;
    status: 'active' | 'syncing';
}

export default function CyberViz() {
    const [nodes, setNodes] = useState<SystemNode[]>([]);
    const [logs, setLogs] = useState<string[]>([]);

    // Initialize with some nodes
    useEffect(() => {
        const initialNodes = Array.from({ length: 5 }, (_, i) => ({
            id: Math.random().toString(36).substr(2, 9),
            x: 20 + Math.random() * 60,
            y: 20 + Math.random() * 60,
            status: 'active' as const,
        }));
        setNodes(initialNodes);

        // Add initial positive logs
        const initialLogs = SYSTEM_EVENTS.slice(0, 5).map(event => 
            `[${new Date().toLocaleTimeString()}] ${event}`
        );
        setLogs(initialLogs);
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            // Pick a random positive system event
            const eventIndex = Math.floor(Math.random() * SYSTEM_EVENTS.length);
            const event = SYSTEM_EVENTS[eventIndex];
            const nodeId = Math.random().toString(36).substr(2, 9);

            setLogs(prev => [
                `[${new Date().toLocaleTimeString()}] ${event} | NODE_${nodeId.slice(0, 4)}`,
                ...prev
            ].slice(0, 10));

            // Occasionally add a syncing node animation
            if (Math.random() > 0.5 && nodes.length < 8) {
                const newNode: SystemNode = {
                    id: nodeId,
                    x: 20 + Math.random() * 60,
                    y: 20 + Math.random() * 60,
                    status: 'syncing'
                };
                setNodes(prev => [...prev, newNode]);

                setTimeout(() => {
                    setNodes(prev => prev.map(n => 
                        n.id === nodeId ? { ...n, status: 'active' } : n
                    ));
                }, 2000);
            }

        }, 2500);

        return () => clearInterval(interval);
    }, [nodes.length]);

    return (
        <div className="w-full h-full relative bg-black/40 border border-green-900/50 backdrop-blur-md overflow-hidden font-mono p-4">
            <div className="absolute top-2 left-4 text-[10px] text-green-500 font-bold tracking-widest uppercase opacity-80">
                SYSTEM_STATUS_MONITOR v2.0
            </div>

            {/* Grid Background */}
            <div className="absolute inset-0 opacity-10 pointer-events-none">
                <div className="w-full h-full" style={{ 
                    backgroundImage: 'linear-gradient(to right, #22c55e 1px, transparent 1px), linear-gradient(to bottom, #22c55e 1px, transparent 1px)',
                    backgroundSize: '40px 40px'
                }}></div>
            </div>

            {/* Visualization Area */}
            <div className="w-full h-[60%] relative mt-6 border border-green-900/30">
                {/* Core Node */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <div className="w-8 h-8 border-2 border-green-500 rounded-full animate-ping absolute"></div>
                    <div className="w-8 h-8 border-2 border-green-500 rounded-full flex items-center justify-center bg-green-900/20">
                        <span className="text-[8px] font-bold text-green-400">CORE</span>
                    </div>
                </div>

                {/* Active Nodes */}
                <AnimatePresence>
                    {nodes.map(node => (
                        <motion.div
                            key={node.id}
                            initial={{ opacity: 0, scale: 0 }}
                            animate={{ 
                                x: `${node.x}%`, 
                                y: `${node.y}%`,
                                opacity: 1, 
                                scale: 1 
                            }}
                            exit={{ opacity: 0, scale: 0 }}
                            transition={{ duration: 1, ease: "easeOut" }}
                            className="absolute"
                        >
                            <div className={`w-2 h-2 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-blue-500'} shadow-[0_0_8px_rgba(34,197,94,0.6)]`}></div>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Connection Lines */}
                <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20">
                    {nodes.map(node => (
                        <motion.line
                            key={`line-${node.id}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2="50%"
                            y2="50%"
                            stroke="#22c55e"
                            strokeWidth="1"
                            initial={{ pathLength: 0 }}
                            animate={{ pathLength: 1 }}
                            transition={{ duration: 1 }}
                        />
                    ))}
                </svg>
            </div>

            {/* Logs Area */}
            <div className="w-full h-[35%] mt-4 bg-black/60 border-t border-green-900/50 p-2 overflow-y-auto custom-scrollbar">
                <div className="text-[9px] text-green-300 font-bold mb-2 uppercase border-b border-green-900/30 pb-1">
                    SIEM_EVENT_LOG
                </div>
                <div className="space-y-1">
                    {logs.map((log, i) => (
                        <motion.div 
                            key={i}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="text-[8px] leading-tight text-green-400"
                        >
                            {log}
                        </motion.div>
                    ))}
                </div>
            </div>
        </div>
    );
}
