'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import {
  calculateQuote,
  formatZar,
  FEATURE_OPTIONS,
  PROJECT_TYPES,
  STYLE_OPTIONS,
  type FeatureId,
  type ProjectTypeId,
  type StyleId,
} from '@/lib/configurator';

const TOTAL_STEPS = 5;

const STEP_TITLES = [
  '> SELECT_PROJECT_TYPE',
  '> SELECT_STYLE_VIBE',
  '> SELECT_FEATURES',
  '> DESCRIBE_EXTRAS',
  '> CONTACT_DETAILS',
];

interface SuccessState {
  referenceId: string;
  totalFormatted: string;
  billing: string;
}

export default function ConfigureClient() {
  const [step, setStep] = useState(0);
  const [projectType, setProjectType] = useState<ProjectTypeId | null>(null);
  const [style, setStyle] = useState<StyleId | null>(null);
  const [features, setFeatures] = useState<FeatureId[]>([]);
  const [notes, setNotes] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SuccessState | null>(null);

  const isWebsite = projectType === 'website';
  // Step 2 (style) only applies to websites — collapse the flow for others
  const effectiveStepCount = isWebsite ? TOTAL_STEPS : TOTAL_STEPS - 1;
  const stepTitle = step === 1 && !isWebsite ? STEP_TITLES[2] : STEP_TITLES[step] ?? '';

  const quote = useMemo(
    () =>
      projectType
        ? calculateQuote({ projectType, style: isWebsite ? style : null, features })
        : null,
    [projectType, style, features, isWebsite]
  );

  const toggleFeature = (id: FeatureId) => {
    setFeatures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const canProceed = (): boolean => {
    if (step === 0) return !!projectType;
    if (step === 1) return isWebsite ? !!style : true; // non-website skips style
    if (step === 4) return name.trim().length > 0 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());
    return true;
  };

  const goNext = () => {
    if (!canProceed()) return;
    if (!isWebsite && step === 0) {
      setStep(2); // skip style picker for non-websites
      return;
    }
    if (step < TOTAL_STEPS - 1) {
      setStep((s) => s + 1);
    }
  };

  const goBack = () => {
    setSubmitError(null);
    if (!isWebsite && step === 2) {
      setStep(0);
      return;
    }
    if (step > 0) setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    if (!projectType || submitting) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch('/api/configure', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selection: {
            projectType,
            style: isWebsite ? style : null,
            features,
          },
          notes,
          contact: { name, email, phone, company_name: companyName },
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSubmitError(data?.error ?? 'Submission failed. Please try again.');
        return;
      }
      setSuccess({
        referenceId: data.referenceId,
        totalFormatted: data.estimate.totalFormatted,
        billing: data.estimate.billing,
      });
    } catch {
      setSubmitError('Network error. Please check your connection and try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const progressDisplay = isWebsite
    ? `[STEP ${step + 1}/${TOTAL_STEPS}]`
    : `[STEP ${step >= 1 ? step : step + 1}/${effectiveStepCount}]`;

  if (success) {
    return (
      <div className="min-h-screen w-full bg-black text-green-400 font-mono">
        <div className="max-w-3xl mx-auto px-6 py-16">
          <div className="border border-green-500/70 bg-black/60 box-glow p-8">
            <p className="text-yellow-400 text-xs tracking-widest mb-4">
              {'// QUOTE_REQUEST_TRANSMITTED'}
            </p>
            <h1 className="text-white text-xl md:text-2xl font-bold text-glow mb-4">
              CONFIGURATION RECEIVED.
            </h1>
            <div className="text-sm space-y-2 mb-6">
              <p>
                <span className="text-gray-500">REFERENCE:</span>{' '}
                <span className="text-yellow-400">{success.referenceId}</span>
              </p>
              <p>
                <span className="text-gray-500">ESTIMATED{' '}
                  {success.billing === 'monthly' ? 'TOTAL / MONTH' : 'TOTAL'}:</span>{' '}
                <span className="text-white font-bold">{success.totalFormatted}</span>
              </p>
              <p className="text-gray-400 text-xs leading-relaxed">
                {'>'} A scope summary has been emailed to you and to owen@m4n.co.za. This is an
                estimate based on your selections — final scope and price confirmed after a
                consultation.
              </p>
            </div>
            <div className="flex flex-wrap gap-3 pt-4 border-t border-green-800/50">
              <Link
                href="/"
                className="px-4 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black transition-colors text-xs font-bold tracking-widest"
              >
                &lt; RETURN_TO_TERMINAL
              </Link>
              <Link
                href="/pricing"
                className="px-4 py-2 border border-green-800 text-green-400 hover:bg-green-900/30 transition-colors text-xs font-bold tracking-widest"
              >
                VIEW_PRICING
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-black text-green-400 font-mono bg-grid-pattern">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="flex items-center justify-between mb-8 border-b border-green-800/50 pb-6">
          <div>
            <h1 className="text-yellow-400 font-bold tracking-widest text-lg md:text-xl text-glow">
              {'// PROJECT CONFIGURATOR'}
            </h1>
            <p className="text-[11px] md:text-xs text-green-300 opacity-80 mt-1">
              Scope it yourself. Get an instant estimate. Final quote after a quick consultation.
            </p>
          </div>
          <Link
            href="/pricing"
            className="font-mono text-green-400 text-xs border border-green-800 bg-black/80 px-3 py-2 hover:bg-green-900/30 transition-colors whitespace-nowrap"
          >
            {`< PRICING`}
          </Link>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-3 mb-6">
          <span className="text-[10px] text-gray-500 tracking-widest">{progressDisplay}</span>
          <div className="flex-1 h-[2px] bg-green-900/50 relative overflow-hidden">
            <div
              className="absolute left-0 top-0 h-full bg-green-500 transition-all duration-500"
              style={{
                width: `${((step + 1) / effectiveStepCount) * 100}%`,
              }}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-8 items-start">
          {/* ---- Main panel ---- */}
          <div className="border border-green-800/60 bg-black/50 p-5 md:p-7 min-h-[380px]">
            <h2 className="text-sm font-bold text-green-400 tracking-widest uppercase mb-6">
              {stepTitle}
            </h2>

            {/* STEP 1: PROJECT TYPE */}
            {step === 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {PROJECT_TYPES.map((t) => {
                  const selected = projectType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setProjectType(t.id);
                        if (t.id !== 'website') setStyle(null);
                      }}
                      className={`text-left border p-4 transition-all ${
                        selected
                          ? 'border-green-400 bg-green-900/20 box-glow'
                          : 'border-green-800/60 bg-black/40 hover:border-green-600 hover:bg-green-900/10'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-green-400 font-bold text-xs tracking-wider">
                          {selected ? '[x] ' : '[ ] '}
                          {t.label}
                        </span>
                        <span className="text-[9px] px-2 py-0.5 border border-yellow-700/60 text-yellow-400 tracking-widest">
                          {t.billing === 'monthly'
                            ? '/ MONTH'
                            : t.billing === 'scoped'
                              ? 'SCOPED'
                              : 'ONCE-OFF'}
                        </span>
                      </div>
                      <p className="text-gray-500 italic text-[10px] mb-2">{t.tagline}</p>
                      <p className="text-gray-400 text-[10px] leading-relaxed">{t.detail}</p>
                      <p className="mt-3 text-[10px] text-gray-500">
                        BASE: <span className="text-white">{formatZar(t.baseEstimateZar)}</span>
                      </p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 2: STYLE / VIBE (website only) */}
            {step === 1 && isWebsite && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {STYLE_OPTIONS.map((s) => {
                  const selected = style === s.id;
                  return (
                    <button
                      key={s.id}
                      onClick={() => setStyle(s.id)}
                      className={`text-left border p-4 transition-all ${
                        selected
                          ? 'border-green-400 bg-green-900/20 box-glow'
                          : 'border-green-800/60 bg-black/40 hover:border-green-600 hover:bg-green-900/10'
                      }`}
                    >
                      {/* visual reference card — mini layout mockup */}
                      <div className={`border border-green-900/80 bg-black p-3 mb-3 ${selected ? 'box-glow' : ''}`}>
                        <div className={`text-[8px] tracking-widest mb-2 ${s.preview.accent}`}>
                          {'\u2593\u2593'} SAMPLE.SITE
                        </div>
                        <div className="space-y-1.5">
                          {s.preview.layout.map((w, i) => (
                            <div
                              key={i}
                              className={`h-1.5 ${w} ${
                                i === 0 ? 'bg-green-500/70' : 'bg-green-800/60'
                              }`}
                            />
                          ))}
                        </div>
                        {s.id === 'bold-animated' && (
                          <div className="mt-2 h-6 border border-dashed border-yellow-700/50 relative overflow-hidden">
                            <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-transparent via-yellow-900/20 to-transparent" />
                          </div>
                        )}
                        {s.id === 'portfolio' && (
                          <div className="mt-2 grid grid-cols-3 gap-1">
                            {[0, 1, 2].map((i) => (
                              <div key={i} className="h-4 bg-purple-900/30 border border-purple-800/40" />
                            ))}
                          </div>
                        )}
                      </div>
                      <div className="text-green-400 font-bold text-xs tracking-wider mb-1">
                        {selected ? '[x] ' : '[ ] '}
                        {s.label}
                      </div>
                      <p className="text-gray-500 text-[10px] leading-relaxed">{s.desc}</p>
                    </button>
                  );
                })}
              </div>
            )}

            {/* STEP 3: FEATURES + RUNNING TOTAL */}
            {step === 2 && (
              <div>
                <p className="text-[11px] text-gray-500 mb-4">
                  Tick what you need. The estimate on the right updates as you build.
                </p>
                <div className="space-y-2">
                  {FEATURE_OPTIONS.map((f) => {
                    const checked = features.includes(f.id);
                    return (
                      <label
                        key={f.id}
                        className={`flex items-start gap-3 border p-3 cursor-pointer transition-all ${
                          checked
                            ? 'border-green-400/80 bg-green-900/15'
                            : 'border-green-800/60 bg-black/40 hover:border-green-700 hover:bg-green-900/10'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFeature(f.id)}
                          className="sr-only"
                        />
                        <span className={`text-sm shrink-0 ${checked ? 'text-green-400' : 'text-gray-600'}`}>
                          {checked ? '[x]' : '[ ]'}
                        </span>
                        <span className="flex-1">
                          <span className="block text-green-400 text-[11px] font-bold tracking-wider">
                            {f.label}
                          </span>
                          <span className="block text-gray-500 text-[10px] mt-0.5 leading-relaxed">
                            {f.desc}
                          </span>
                        </span>
                        <span className="text-right shrink-0">
                          {f.estimateZar === 0 ? (
                            <span className="text-[10px] px-2 py-0.5 border border-green-700/60 text-green-400 tracking-widest">
                              INCLUDED
                            </span>
                          ) : (
                            <span className="text-white text-xs">+{formatZar(f.estimateZar)}</span>
                          )}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}

            {/* STEP 4: FREE TEXT */}
            {step === 3 && (
              <div>
                <div className="border border-yellow-700/50 bg-yellow-900/10 p-4 mb-5">
                  <p className="text-yellow-400 text-xs leading-relaxed">
                    Doesn&apos;t fit the options above? Tell me and we&apos;ll scope it together.
                  </p>
                </div>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  maxLength={5000}
                  rows={9}
                  placeholder={
                    '> Describe anything not covered by the checklist — unusual integrations,\n> existing systems, deadlines, examples of sites you like...\n> (Optional — leave blank if everything was covered.)'
                  }
                  className="w-full bg-black/70 border border-green-800/60 focus:border-green-500 outline-none p-4 text-sm text-green-200 placeholder:text-gray-700 resize-y custom-scrollbar"
                />
                <p className="text-[10px] text-gray-600 mt-2 text-right">{notes.length}/5000</p>
              </div>
            )}

            {/* STEP 5: CONTACT + SUBMIT */}
            {step === 4 && (
              <div>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] text-gray-500 tracking-widest mb-1.5">
                        NAME *
                      </label>
                      <input
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        maxLength={255}
                        className="w-full bg-black/70 border border-green-800/60 focus:border-green-500 outline-none px-3 py-2.5 text-sm text-green-200"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 tracking-widest mb-1.5">
                        EMAIL *
                      </label>
                      <input
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        type="email"
                        maxLength={255}
                        className="w-full bg-black/70 border border-green-800/60 focus:border-green-500 outline-none px-3 py-2.5 text-sm text-green-200"
                        placeholder="you@company.co.za"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 tracking-widest mb-1.5">
                        PHONE
                      </label>
                      <input
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        maxLength={50}
                        className="w-full bg-black/70 border border-green-800/60 focus:border-green-500 outline-none px-3 py-2.5 text-sm text-green-200"
                        placeholder="+27 ..."
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] text-gray-500 tracking-widest mb-1.5">
                        COMPANY
                      </label>
                      <input
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        maxLength={255}
                        className="w-full bg-black/70 border border-green-800/60 focus:border-green-500 outline-none px-3 py-2.5 text-sm text-green-200"
                        placeholder="(optional)"
                      />
                    </div>
                  </div>

                  <div className="border border-green-800/60 bg-black/40 p-4">
                    <p className="text-[10px] text-gray-500 tracking-widest mb-2">
                      {'> FINAL_CONFIGURATION'}
                    </p>
                    <pre className="text-[11px] text-green-300 whitespace-pre-wrap leading-relaxed">
{`PROJECT: ${PROJECT_TYPES.find((t) => t.id === projectType)?.label ?? '-'}${
  isWebsite && style
    ? `\nSTYLE:   ${STYLE_OPTIONS.find((s) => s.id === style)?.label ?? '-'}`
    : ''
}\nFEATURES:${features.length > 0
  ? '\n' + features.map((f) => `  [x] ${FEATURE_OPTIONS.find((o) => o.id === f)?.label ?? f}`).join('\n')
  : ' none'}`}
                    </pre>
                  </div>

                  <p className="text-[10px] text-gray-600 leading-relaxed">
                    On submit, your configuration is saved and emailed with a PDF scope summary to
                    you and owen@m4n.co.za. Estimates are not binding — final scope and price are
                    confirmed in a consultation.
                  </p>

                  {submitError && (
                    <p className="text-red-400 text-xs border border-red-800/60 bg-red-900/10 px-3 py-2">
                      ERROR: {submitError}
                    </p>
                  )}

                  <button
                    onClick={handleSubmit}
                    disabled={submitting || !canProceed()}
                    className="w-full sm:w-auto px-8 py-3 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors font-bold text-sm tracking-widest"
                  >
                    {submitting ? 'TRANSMITTING...' : '$ GENERATE_QUOTE'}
                  </button>
                </div>
              </div>
            )}

            {/* NAV BUTTONS */}
            {step < 4 && (
              <div className="flex items-center gap-3 mt-8 pt-5 border-t border-green-800/40">
                <button
                  onClick={goBack}
                  disabled={step === 0 || (isWebsite === false && step === 2)}
                  className="px-4 py-2 border border-green-800/60 text-green-400 text-xs hover:bg-green-900/30 disabled:opacity-30 disabled:cursor-not-allowed transition-colors tracking-widest"
                >
                  {'< BACK'}
                </button>
                <button
                  onClick={goNext}
                  disabled={!canProceed()}
                  className="px-6 py-2 border border-green-500 text-green-500 hover:bg-green-500 hover:text-black disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-transparent disabled:hover:text-green-500 transition-colors font-bold text-xs tracking-widest"
                >
                  NEXT {'>'}
                </button>
                {!canProceed() && (
                  <span className="text-[10px] text-gray-600 italic hidden sm:inline">
                    make a selection to continue
                  </span>
                )}
              </div>
            )}
            {step === 4 && (
              <div className="mt-6">
                <button
                  onClick={goBack}
                  className="px-4 py-2 border border-green-800/60 text-green-400 text-xs hover:bg-green-900/30 transition-colors tracking-widest"
                >
                  {'< BACK'}
                </button>
              </div>
            )}
          </div>

          {/* ---- Running-total sidebar ---- */}
          <aside className="lg:sticky lg:top-8 border border-green-500/60 bg-black/70 box-glow p-5">
            <p className="text-[10px] text-yellow-400 tracking-widest mb-4">
              {'> RUNNING_ESTIMATE'}
            </p>
            {!quote ? (
              <p className="text-[11px] text-gray-600 leading-relaxed">
                Select a project type to start building your estimate.
              </p>
            ) : (
              <>
                <ul className="space-y-2 mb-4">
                  {quote.lineItems.map((li) => (
                    <li key={li.label} className="flex items-baseline justify-between gap-3 text-[11px]">
                      <span className="text-gray-400 truncate" title={li.label}>
                        {li.label.replace(' \u2014 BASE', '')}
                      </span>
                      <span className={li.amountZar === 0 ? 'text-gray-600' : 'text-green-300'}>
                        {li.amountZar === 0 ? 'incl.' : formatZar(li.amountZar)}
                      </span>
                    </li>
                  ))}
                </ul>
                <div className="border-t border-green-800/60 pt-3 flex items-baseline justify-between">
                  <span className="text-[10px] text-gray-500 tracking-widest">
                    {quote.billing === 'monthly' ? 'TOTAL / MO' : 'TOTAL EST'}
                  </span>
                  <span className="text-white font-extrabold text-xl text-glow">
                    {formatZar(quote.totalZar)}
                  </span>
                </div>
                <p className="text-[9px] text-gray-600 mt-3 leading-relaxed">
                  Estimate only. Not a binding quote — final scope &amp; price confirmed after
                  consultation.
                </p>
              </>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
