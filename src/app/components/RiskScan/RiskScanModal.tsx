'use client';

import { useState, useEffect, useRef } from 'react';
import { sendEmail } from '../../actions/send-email';

interface RiskScanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const SCAN_STEPS = [
    "INITIALIZING_TARGET_RECON...",
    "SCANNING_PUBLIC_DNS_RECORDS...",
    "CHECKING_SSL_CERTIFICATE_STATUS...",
    "ENUMERATING_OPEN_PORTS...",
    "ANALYZING_HTTP_HEADERS...",
    "DETECTING_EXPOSED_API_ENDPOINTS...",
    "SEARCHING_LEAKED_CREDENTIAL_DATABASES...",
    "EVALUATING_DOMAIN_REPUTATION...",
    "SCAN_COMPLETE. VULNERABILITIES_DETECTED."
];

export default function RiskScanModal({ isOpen, onClose }: RiskScanModalProps) {
    const [scanProgress, setScanProgress] = useState(0);
    const [currentStepIndex, setCurrentStepIndex] = useState(0);
    const [scanComplete, setScanComplete] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setScanProgress(0);
            setCurrentStepIndex(0);
            setScanComplete(false);
            setSubmitStatus('idle');
        }
    }, [isOpen]);

    // Auto-scroll logs
    useEffect(() => {
        logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [currentStepIndex, isOpen]);

    // Run Scan Simulation
    useEffect(() => {
        if (!isOpen || scanComplete) return;

        const totalSteps = SCAN_STEPS.length;
        const stepDuration = 600; // ms per step

        const timer = setInterval(() => {
            setCurrentStepIndex(prev => {
                if (prev >= totalSteps - 1) {
                    clearInterval(timer);
                    setScanComplete(true);
                    return prev;
                }
                return prev + 1;
            });
            setScanProgress(prev => Math.min(prev + (100 / totalSteps), 100));
        }, stepDuration);

        return () => clearInterval(timer);
    }, [isOpen, scanComplete]);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        
        const formData = new FormData(e.currentTarget);
        // Add a hidden field to indicate this is a Risk Scan request
        formData.append('message', 'REQUESTING_RISK_SCORE_REPORT'); 
        
        const result = await sendEmail(formData);

        setIsSubmitting(false);

        if (result.success) {
            setSubmitStatus('success');
            setTimeout(() => {
                onClose();
            }, 3000);
        } else {
            setSubmitStatus('error');
        }
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg border-2 border-red-500 bg-black p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] font-mono relative flex flex-col gap-4"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-red-900 pb-2">
                    <h2 className="text-xl text-red-500 font-bold tracking-wider animate-pulse">
                        DIGITAL_PERIMETER_SCAN
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-bold px-2 transition-colors"
                    >
                        [X]
                    </button>
                </div>

                {/* Scan Visualization */}
                <div className="h-48 bg-gray-900/50 border border-gray-800 p-4 overflow-y-auto font-mono text-xs">
                    {SCAN_STEPS.slice(0, currentStepIndex + 1).map((step, idx) => (
                        <div key={idx} className={`mb-1 ${idx === SCAN_STEPS.length - 1 ? 'text-red-500 font-bold' : 'text-green-500'}`}>
                            <span className="opacity-50 mr-2">[{new Date().toLocaleTimeString()}]</span>
                            {step}
                        </div>
                    ))}
                    <div ref={logsEndRef} />
                </div>

                {/* Progress Bar */}
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-red-500 transition-all duration-300"
                        style={{ width: `${scanComplete ? 100 : scanProgress}%` }}
                    />
                </div>

                {/* Result / Form */}
                {scanComplete ? (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {submitStatus === 'success' ? (
                            <div className="text-center py-6">
                                <p className="text-green-400 text-lg font-bold mb-2">REPORT GENERATED</p>
                                <p className="text-gray-400 text-sm">Check your inbox for the encrypted dossier.</p>
                            </div>
                        ) : (
                            <>
                                <div className="bg-red-900/20 border border-red-900/50 p-3 mb-4">
                                    <p className="text-red-400 text-sm font-bold text-center">
                                        ⚠ POTENTIAL EXPOSURE DETECTED
                                    </p>
                                    <p className="text-gray-400 text-xs text-center mt-1">
                                        Your digital footprint contains visible surface area.
                                    </p>
                                </div>

                                <form onSubmit={handleSubmit} className="space-y-3">
                                    <div>
                                        <label htmlFor="email" className="block text-gray-500 text-xs mb-1 uppercase">
                                            SEND FULL REPORT TO:
                                        </label>
                                        <input 
                                            type="email" 
                                            name="email" 
                                            required
                                            className="w-full bg-black border border-gray-700 text-white p-2 focus:border-red-500 focus:outline-none transition-colors"
                                            placeholder="ENTER_EMAIL_ADDRESS"
                                        />
                                    </div>
                                    <button 
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full bg-red-600 hover:bg-red-500 text-black font-bold py-2 uppercase tracking-widest transition-all"
                                    >
                                        {isSubmitting ? 'GENERATING...' : 'GET_REMEDIATION_PLAN >>'}
                                    </button>
                                </form>
                            </>
                        )}
                    </div>
                ) : (
                    <div className="text-center py-8">
                        <p className="text-gray-500 text-sm animate-pulse">ANALYZING VECTORS...</p>
                    </div>
                )}
            </div>
        </div>
    );
}
