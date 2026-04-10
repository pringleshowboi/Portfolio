'use client';

import { useState, useEffect, useCallback } from 'react';
import { sendEmail } from '../../actions/send-email';

interface ContactModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export default function ContactModal({ isOpen, onClose }: ContactModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle');

    // Handle ESC key to close modal
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
            // Prevent body scroll when modal is open
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, handleKeyDown]);

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);
        setStatus('idle');

        const formData = new FormData(e.currentTarget);
        const result = await sendEmail(formData);

        setIsSubmitting(false);

        if (result.success) {
            setStatus('success');
            setTimeout(() => {
                onClose();
                setStatus('idle');
            }, 2000);
        } else {
            setStatus('error');
        }
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
            onClick={onClose} // Close when clicking the backdrop
        >
            <div 
                className="w-full max-w-lg border-2 border-green-500 bg-black p-6 shadow-[0_0_20px_rgba(34,197,94,0.3)] font-mono relative"
                onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside the modal
            >
                
                {/* Header */}
                <div className="flex justify-between items-center mb-6 border-b border-green-800 pb-2">
                    <h2 className="text-xl text-yellow-400 font-bold tracking-wider">
                        SECURITY_AUDIT_REQUEST
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-red-500 hover:text-red-400 font-bold border border-red-900 hover:border-red-500 px-3 py-1 transition-colors uppercase text-[10px]"
                        aria-label="Close Modal"
                    >
                        [X] ABORT
                    </button>
                </div>

                {status === 'success' ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
                        <div className="text-4xl animate-bounce">🛡️</div>
                        <h3 className="text-green-400 text-xl font-bold uppercase tracking-widest">AUDIT_PROTOCOL_INITIALIZED</h3>
                        <p className="text-green-600 text-sm">Security request queued for analysis.</p>
                        <p className="text-xs text-gray-500 mt-4">Closing secure tunnel...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label htmlFor="name" className="block text-green-600 text-[10px] mb-1 uppercase font-bold">
                                {'// ORGANIZATION_OR_IDENT'}
                            </label>
                            <input 
                                type="text" 
                                name="name" 
                                id="name"
                                required
                                className="w-full bg-green-900/10 border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900 text-sm"
                                placeholder="ENTER ENTITY NAME"
                            />
                        </div>

                        <div>
                            <label htmlFor="email" className="block text-green-600 text-[10px] mb-1 uppercase font-bold">
                                {'// SECURE_COMMS_CHANNEL'}
                            </label>
                            <input 
                                type="email" 
                                name="email" 
                                id="email"
                                required
                                className="w-full bg-green-900/10 border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900 text-sm"
                                placeholder="ENTER ENCRYPTED EMAIL ADDRESS"
                            />
                        </div>

                        <div>
                            <label htmlFor="message" className="block text-green-600 text-[10px] mb-1 uppercase font-bold">
                                {'// AUDIT_SCOPE_OR_THREAT_INTEL'}
                            </label>
                            <textarea 
                                name="message" 
                                id="message"
                                rows={4}
                                required
                                className="w-full bg-green-900/10 border border-green-700 text-green-300 p-2 focus:outline-none focus:border-green-400 transition-colors placeholder-green-900 resize-none text-sm"
                                placeholder="DESCRIBE INFRASTRUCTURE OR SECURITY CHALLENGES..."
                            />
                        </div>

                        {status === 'error' && (
                            <div className="p-2 border border-red-500 bg-red-900/20 text-red-400 text-[10px] font-bold">
                                ERROR: ENCRYPTION HANDSHAKE FAILED. RETRY TRANSMISSION.
                            </div>
                        )}

                        <div className="pt-4 border-t border-green-800 flex justify-between items-center">
                            <p className="text-[9px] text-gray-500 uppercase italic">
                                * All data encrypted via AES-256
                            </p>
                            <button 
                                type="submit" 
                                disabled={isSubmitting}
                                className={`
                                    px-8 py-2 font-bold tracking-[0.2em] uppercase text-xs border transition-all duration-300
                                    ${isSubmitting 
                                        ? 'bg-gray-800 border-gray-600 text-gray-500 cursor-not-allowed' 
                                        : 'bg-green-900/30 border-green-500 text-green-400 hover:bg-green-500 hover:text-black shadow-[0_0_15px_rgba(34,197,94,0.3)] hover:shadow-[0_0_25px_rgba(34,197,94,0.7)]'
                                    }
                                `}
                            >
                                {isSubmitting ? 'UPLOADING...' : 'SUBMIT_FOR_AUDIT'}
                            </button>
                        </div>
                    </form>
                )}

                {/* Decorative corner markers */}
                <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-green-500"></div>
                <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-green-500"></div>
                <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-green-500"></div>
                <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-green-500"></div>
            </div>
        </div>
    );
}
