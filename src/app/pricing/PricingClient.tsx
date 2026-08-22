'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';

const WEB_TIERS = [
    {
        price: 'R0',
        unit: 'ONCE-OFF',
        name: 'FIRST WEBSITE BUILD',
        tagline: 'Your first business website, built free.',
        features: [
            'Design + full build (Next.js)',
            'Mobile responsive',
            'Basic SEO setup',
            'Contact / lead form wired to email',
            'Handover documentation',
            'You cover hosting & domain costs',
        ],
        highlight: false,
    },
    {
        price: 'R50',
        unit: '/ MONTH',
        name: 'MAINTENANCE RETAINER',
        tagline: 'Keeps your site healthy while you run the business.',
        features: [
            'Content updates & minor changes',
            'Uptime monitoring',
            'Backup verification',
            'Priority fix turnaround',
            'Monthly status note',
        ],
        highlight: true,
    },
    {
        price: 'R500+',
        unit: '/ MONTH',
        name: 'CRM / DATABASE ADD-ON',
        tagline: 'Tooling layered onto your site that actually runs workflow.',
        features: [
            'Lead capture & client records',
            'Reporting dashboards',
            'Role-based access for your team',
            'Integrations with existing systems',
            'Price scales with scope',
        ],
        highlight: false,
    },
    {
        price: 'CUSTOM',
        unit: 'QUOTE',
        name: 'DATA ENGINEERING',
        tagline: 'For data work and in-house team integration.',
        features: [
            'Data pipelines & ETL',
            'Spreadsheet-to-database migrations',
            'Workflow automation',
            'Integration with in-house team tooling',
            'Scoped per project, fixed quote',
        ],
        highlight: false,
    },
];

const GRC_SCOPES = [
    {
        name: 'POPIA COMPLIANCE ASSESSMENT',
        desc: 'Gap analysis of how your business collects, stores and processes personal information \u2014 with a prioritized remediation list.',
    },
    {
        name: 'POLICY DEVELOPMENT',
        desc: 'Plain-language policies drafted for your actual operations \u2014 not template paperwork nobody reads.',
    },
    {
        name: 'RISK REGISTER SETUP',
        desc: 'A living risk register your team can maintain, mapped to realistic threat scenarios.',
    },
    {
        name: 'AUDIT READINESS PREP',
        desc: 'Evidence gathering, documentation and process prep before an audit or client security questionnaire lands.',
    },
];

export default function PricingClient() {
    const router = useRouter();

    return (
        <div className="min-h-screen w-full bg-black text-green-400 font-mono">
            <div className="max-w-6xl mx-auto px-6 py-12">
                {/* Header */}
                <div className="flex items-center justify-between mb-10 border-b border-green-800/50 pb-6">
                    <div>
                        <h1 className="text-yellow-400 font-bold tracking-widest text-xl md:text-2xl text-glow">
                            {'// ENGAGEMENT MODELS & PRICING'}
                        </h1>
                        <p className="text-[11px] md:text-xs text-green-300 font-mono opacity-80 mt-1">
                            Transparent rates. Every engagement starts with a conversation.
                        </p>
                    </div>
                    <button
                        onClick={() => router.push('/')}
                        className="font-mono text-green-400 text-xs border border-green-800 bg-black/80 px-3 py-2 hover:bg-green-900/30 transition-colors"
                    >
                        {`< RETURN`}
                    </button>
                </div>

                {/* Web Services */}
                <h2 className="text-sm font-bold text-yellow-400 mb-2 tracking-widest uppercase">
                    {'> WEB SERVICES'}
                </h2>
                <p className="text-[11px] text-gray-400 font-mono mb-6 max-w-3xl leading-relaxed">
                    Build first, pay for what actually needs maintaining. No lock-in contracts.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 mb-14">
                    {WEB_TIERS.map((tier) => (
                        <div
                            key={tier.name}
                            className={`border p-5 flex flex-col transition-all hover:border-green-500 ${
                                tier.highlight
                                    ? 'border-green-500/80 bg-green-900/15 box-glow'
                                    : 'border-green-800/60 bg-black/40 hover:bg-green-900/10'
                            }`}
                        >
                            {tier.highlight && (
                                <span className="self-start mb-3 px-2 py-0.5 text-[9px] font-bold tracking-widest bg-green-600 text-black">
                                    MOST POPULAR
                                </span>
                            )}
                            <p className="text-white font-extrabold text-2xl leading-none">{tier.price}</p>
                            <p className="text-green-600 text-[10px] tracking-widest mt-1 mb-3">{tier.unit}</p>
                            <h3 className="text-green-400 font-bold text-xs mb-1 uppercase tracking-wider">{tier.name}</h3>
                            <p className="text-gray-500 italic text-[10px] mb-4 leading-relaxed">{tier.tagline}</p>
                            <ul className="space-y-2 text-[10px] text-gray-300 flex-1">
                                {tier.features.map((f) => (
                                    <li key={f} className="flex items-start gap-2">
                                        <span className="text-green-600">{'\u003E'}</span>
                                        {f}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* GRC Advisory */}
                <h2 className="text-sm font-bold text-yellow-400 mb-2 tracking-widest uppercase">
                    {'> GRC ADVISORY'}
                </h2>
                <p className="text-[11px] text-gray-400 font-mono mb-6 max-w-3xl leading-relaxed">
                    Scoped per engagement. You get a fixed quote before any work begins &mdash;
                    sized to your business, not a generic retainer.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-12">
                    {GRC_SCOPES.map((scope) => (
                        <div key={scope.name} className="border border-green-800/60 bg-black/40 p-5 hover:border-green-500 transition-all hover:bg-green-900/10">
                            <div className="flex items-start justify-between gap-4">
                                <h3 className="text-green-400 font-bold text-xs uppercase tracking-wider">{scope.name}</h3>
                                <span className="shrink-0 px-2 py-0.5 text-[9px] font-bold tracking-widest border border-yellow-700/60 text-yellow-400">
                                    SCOPED
                                </span>
                            </div>
                            <p className="text-gray-400 text-[11px] mt-3 leading-relaxed">{scope.desc}</p>
                        </div>
                    ))}
                </div>

                {/* Footer CTA */}
                <div className="border-t border-green-800/50 pt-8 pb-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                    <p className="text-[11px] text-gray-500 font-mono max-w-xl leading-relaxed">
                        {'\u003E'} All prices in ZAR. Open the terminal and hit SECURE COMMS to start the conversation,
                        or request a compliance snapshot first &mdash; it&apos;s free too.
                    </p>
                    <Link
                        href="/"
                        className="inline-block px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors font-bold text-sm whitespace-nowrap"
                    >
                        &lt; RETURN_TO_TERMINAL
                    </Link>
                </div>
            </div>
        </div>
    );
}
