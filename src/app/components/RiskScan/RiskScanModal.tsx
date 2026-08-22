'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { sendEmail } from '../../actions/send-email';

interface RiskScanModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface AuditResult {
    domain: string;
    checked_at: string;
    dns: Record<string, string[]>;
    tls: {
        reachable: boolean;
        authorized: boolean;
        authorizationError: string | null;
        issuer: string | null;
        subject: string | null;
        validFrom: string | null;
        validTo: string | null;
        daysRemaining: number | null;
    };
    email: {
        spf: boolean;
        dmarc: boolean;
    };
    headers: {
        reachable: boolean;
        hsts: boolean;
        csp: boolean;
        frameOptions: boolean;
        contentTypeOptions: boolean;
        referrerPolicy: boolean;
    };
    logs: string[];
}

type Mode = 'input' | 'live-loading' | 'live-done' | 'sample';

// What a live check covers today (honest scope description)
const LIVE_CHECK_SCOPE = [
    'Public DNS record hygiene (A / NS / MX / TXT)',
    'TLS certificate validity & expiry on port 443',
    'Email spoofing protection (SPF / DMARC)',
    'Security headers on your main site',
];

const SAMPLE_AUDIT_NOTE =
    'This is a static sample of what a full engagement covers. Enter a domain and run the live check to see real DNS, TLS, SPF/DMARC and header results for it. No port scanning or intrusion testing is performed by this tool.';

const DOMAIN_RE = /^(?=.{1,253}$)(?!-)[a-z0-9-]{1,63}(?<!-)(\.(?!-)[a-z0-9_-]{1,63}(?<!-))+$/i;

export default function RiskScanModal({ isOpen, onClose }: RiskScanModalProps) {
    const [mode, setMode] = useState<Mode>('input');
    const [domainInput, setDomainInput] = useState('');
    const [auditError, setAuditError] = useState('');
    const [audit, setAudit] = useState<AuditResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
    const logsEndRef = useRef<HTMLDivElement>(null);

    // Handle ESC key to close modal
    const handleKeyDown = useCallback((e: KeyboardEvent) => {
        if (e.key === 'Escape' && isOpen) {
            onClose();
        }
    }, [isOpen, onClose]);

    // Reset state when modal opens
    useEffect(() => {
        if (isOpen) {
            setMode('input');
            setDomainInput('');
            setAuditError('');
            setAudit(null);
            setSubmitStatus('idle');
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = '';
        }
        return () => {
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    // Add/remove ESC key listener
    useEffect(() => {
        if (isOpen) {
            document.addEventListener('keydown', handleKeyDown);
        }
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, handleKeyDown]);

    // Auto-scroll logs
    useEffect(() => {
        if (mode === 'live-done') {
            logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
        }
    }, [mode, audit]);

    const runLiveCheck = async () => {
        const cleaned = domainInput.trim().toLowerCase().replace(/^https?:\/\//, '').split('/')[0].replace(/:\d+$/, '');
        if (!DOMAIN_RE.test(cleaned)) {
            setAuditError('> INVALID_TARGET: enter a public domain, e.g. yourdomain.co.za');
            return;
        }
        setAuditError('');
        setMode('live-loading');
        try {
            const res = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ domain: cleaned }),
            });
            const json = await res.json();
            if (!res.ok || !json?.data) {
                throw new Error(json?.error || 'Live check failed');
            }
            setAudit(json.data as AuditResult);
            setMode('live-done');
        } catch (err) {
            setAuditError(`> CHECK_FAILED: ${err instanceof Error ? err.message : 'unknown error'}`);
            setMode('input');
        }
    };

    const showSample = () => {
        setAuditError('');
        setMode('sample');
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsSubmitting(true);

        const formData = new FormData(e.currentTarget);
        formData.append(
            'message',
            `REQUESTING_COMPLIANCE_SNAPSHOT_REVIEW${audit ? ` FOR: ${audit.domain}` : ' (sample preview)'}`
        );
        formData.append('source', 'risk-scan');

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

    const tlsBadge = (tls: AuditResult['tls']) => {
        if (!tls.reachable) return { text: 'SSL: UNREACHABLE', cls: 'border-gray-600/60 text-gray-400' };
        if (tls.daysRemaining !== null && tls.daysRemaining < 0)
            return { text: `SSL: EXPIRED`, cls: 'border-red-500 text-red-400' };
        if (tls.authorized) return { text: 'SSL: VALID', cls: 'border-green-500 text-green-400' };
        return { text: 'SSL: INVALID', cls: 'border-red-500 text-red-400' };
    };

    return (
        <div 
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
            onClick={onClose}
        >
            <div 
                className="w-full max-w-lg border-2 border-red-500 bg-black p-6 shadow-[0_0_30px_rgba(239,68,68,0.2)] font-mono relative flex flex-col gap-4 max-h-[90vh] overflow-y-auto custom-scrollbar"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center border-b border-red-900 pb-2">
                    <h2 className="text-xl text-red-500 font-bold tracking-wider">
                        COMPLIANCE_RISK_SNAPSHOT
                    </h2>
                    <button 
                        onClick={onClose}
                        className="text-gray-500 hover:text-white font-bold px-2 transition-colors"
                    >
                        [X]
                    </button>
                </div>

                {mode === 'input' && (
                    <>
                        <p className="text-xs text-gray-400 leading-relaxed">
                            {'>'} Enter a public domain for a <span className="text-green-400">real, read-only</span> check:
                        </p>
                        <ul className="text-xs text-gray-300 space-y-1">
                            {LIVE_CHECK_SCOPE.map((item, idx) => (
                                <li key={idx} className="flex items-center gap-2">
                                    <span className="text-green-500">{'\u003E'}</span> {item}
                                </li>
                            ))}
                        </ul>
                        <p className="text-[10px] text-gray-600 leading-relaxed">
                            No port scanning, no intrusion attempts — only public DNS records, the site&apos;s TLS certificate, published SPF/DMARC records and one page fetch for security headers are inspected.
                        </p>

                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={domainInput}
                                onChange={(e) => setDomainInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); runLiveCheck(); } }}
                                placeholder="TARGET_DOMAIN (e.g. yourdomain.co.za)"
                                autoComplete="off"
                                spellCheck={false}
                                className="flex-1 bg-black border border-gray-700 text-white p-2 focus:border-red-500 focus:outline-none transition-colors text-xs uppercase"
                            />
                            <button
                                onClick={runLiveCheck}
                                className="bg-red-600 hover:bg-red-500 text-black font-bold px-4 py-2 uppercase tracking-widest transition-all whitespace-nowrap"
                            >
                                RUN_LIVE_CHECK
                            </button>
                        </div>
                        {auditError && (
                            <p className="text-red-400 text-xs">{auditError}</p>
                        )}
                        <button
                            onClick={showSample}
                            className="text-gray-500 hover:text-gray-300 text-[10px] underline text-left transition-colors"
                        >
                            NO DOMAIN? VIEW SAMPLE AUDIT PREVIEW
                        </button>
                    </>
                )}

                {mode === 'live-loading' && (
                    <div className="py-8 text-center">
                        <p className="text-gray-400 text-sm animate-pulse">
                            PERFORMING_LIVE_CHECKS ON {domainInput.toUpperCase()}...
                        </p>
                        <p className="text-gray-600 text-[10px] mt-2">Resolving DNS / inspecting certificate & headers — real network queries in progress</p>
                    </div>
                )}

                {mode === 'live-done' && audit && (() => {
                    const badge = tlsBadge(audit.tls);
                    return (
                        <>
                            <div className="flex flex-wrap items-center gap-2">
                                <span className="px-2 py-0.5 text-[10px] border border-green-500 text-green-400 font-bold tracking-wider">
                                    TARGET: {audit.domain.toUpperCase()}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] border font-bold tracking-wider ${badge.cls}`}>
                                    {badge.text}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] border font-bold tracking-wider ${
                                    Object.values(audit.dns).some((arr) => arr.length > 0)
                                        ? 'border-green-500 text-green-400'
                                        : 'border-red-500 text-red-400'
                                }`}>
                                    DNS: {Object.values(audit.dns).some((arr) => arr.length > 0) ? 'RESOLVED' : 'NO RECORDS'}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] border font-bold tracking-wider ${
                                    audit.email?.spf || audit.email?.dmarc
                                        ? 'border-green-500 text-green-400'
                                        : 'border-yellow-600 text-yellow-400'
                                }`}>
                                    SPF/DMARC: {audit.email?.spf && audit.email?.dmarc ? 'BOTH' : audit.email?.spf ? 'SPF ONLY' : audit.email?.dmarc ? 'DMARC ONLY' : 'ABSENT'}
                                </span>
                                <span className={`px-2 py-0.5 text-[10px] border font-bold tracking-wider ${audit.headers?.reachable ? 'border-blue-500 text-blue-400' : 'border-gray-600 text-gray-500'}`}>
                                    HEADERS: {audit.headers?.reachable ? `${[audit.headers.hsts, audit.headers.csp, audit.headers.frameOptions, audit.headers.contentTypeOptions, audit.headers.referrerPolicy].filter(Boolean).length}/5` : 'N/A'}
                                </span>
                            </div>

                            {/* Real results log */}
                            <div className="h-48 bg-gray-900/50 border border-gray-800 p-4 overflow-y-auto font-mono text-xs">
                                {audit.logs.map((log, idx) => (
                                    <div key={idx} className={`mb-1 ${log.startsWith('SNAPSHOT_COMPLETE') ? 'text-green-400 font-bold' : 'text-green-500'}`}>
                                        <span className="opacity-50 mr-2">[{new Date(audit.checked_at).toLocaleTimeString()}]</span>
                                        {log}
                                    </div>
                                ))}
                                <div ref={logsEndRef} />
                            </div>
                        </>
                    );
                })()}

                {mode === 'sample' && (
                    <div>
                        <div className="bg-yellow-900/20 border border-yellow-700/60 p-3 mb-4">
                            <p className="text-yellow-400 text-sm font-bold text-center tracking-wider">
                                [!] SAMPLE AUDIT PREVIEW
                            </p>
                            <p className="text-yellow-200/70 text-[10px] text-center mt-1">
                                NOT A LIVE SCAN — no checks were run against your infrastructure.
                            </p>
                        </div>
                        <p className="text-gray-400 text-xs mb-4 leading-relaxed">{SAMPLE_AUDIT_NOTE}</p>
                        <div className="bg-gray-900/50 border border-gray-800 p-4">
                            <p className="text-gray-500 text-[10px] uppercase tracking-wider mb-2">A full assessment typically includes:</p>
                            <ul className="text-xs text-gray-300 space-y-1">
                                <li className="flex items-center gap-2"><span className="text-green-500">{'\u003E'}</span> DNS &amp; SSL certificate analysis</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">{'\u003E'}</span> External attack-surface review</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">{'\u003E'}</span> Email security posture (SPF/DKIM/DMARC)</li>
                                <li className="flex items-center gap-2"><span className="text-green-500">{'\u003E'}</span> Prioritised remediation plan</li>
                            </ul>
                        </div>
                    </div>
                )}

                {/* Progress Bar — only meaningful during the live call */}
                {mode === 'live-loading' && (
                    <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                        <div className="h-full w-1/3 bg-red-500 animate-pulse" />
                    </div>
                )}

                {/* Result / Form */}
                {(mode === 'live-done' || mode === 'sample') ? (
                    submitStatus === 'success' ? (
                        <div className="text-center py-6">
                            <p className="text-green-400 text-lg font-bold mb-2">REQUEST LOGGED</p>
                            <p className="text-gray-400 text-sm">Check your inbox — we&apos;ll follow up with your snapshot and what it means for compliance.</p>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-3">
                            {submitStatus === 'error' && (
                                <p className="text-red-400 text-xs">TRANSMISSION_FAILED — please retry.</p>
                            )}
                            <div>
                                <label htmlFor="email" className="block text-gray-500 text-xs mb-1 uppercase">
                                    SEND FULL REPORT TO:
                                </label>
                                <input 
                                    type="email" 
                                    name="email" 
                                    required
                                    autoComplete="email"
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
                    )
                ) : null}

                {/* Back to input */}
                {(mode === 'live-done' || mode === 'sample') && submitStatus !== 'success' && (
                    <button
                        onClick={() => { setMode('input'); }}
                        className="text-gray-500 hover:text-gray-300 text-[10px] underline text-left transition-colors"
                    >
                        {'\u003C'} RUN ANOTHER CHECK
                    </button>
                )}
            </div>
        </div>
    );
}
