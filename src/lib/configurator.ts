// ============================================================
// PROJECT CONFIGURATOR — shared pricing config + calculation.
// Used by BOTH the client (running total) and the API route
// (authoritative server-side recalc — never trust client total).
//
// PRICING NOTE: base rates derive from /pricing engagement models
// (R0 first build, R500+/mo CRM, custom data eng, scoped GRC).
// Feature estimates are placeholders pending Owen's confirmation.
// ============================================================

export type ProjectTypeId = 'website' | 'crm' | 'data' | 'grc';
export type BillingModel = 'once-off' | 'monthly' | 'scoped';

export interface ProjectType {
  id: ProjectTypeId;
  label: string;
  tagline: string;
  detail: string;
  baseEstimateZar: number;
  billing: BillingModel;
}

export const PROJECT_TYPES: ProjectType[] = [
  {
    id: 'website',
    label: 'BUSINESS WEBSITE',
    tagline: 'Your presence on the internet.',
    detail:
      'Full Next.js build. First website is R0 base \u2014 you only pay for add-ons beyond the standard build.',
    baseEstimateZar: 0,
    billing: 'once-off',
  },
  {
    id: 'crm',
    label: 'CRM ADD-ON',
    tagline: 'Tooling that runs workflow.',
    detail:
      'Lead capture, client records, reporting dashboards and role-based access layered onto your site. Priced monthly, scales with scope.',
    baseEstimateZar: 500,
    billing: 'monthly',
  },
  {
    id: 'data',
    label: 'DATA ENGINEERING',
    tagline: 'Pipelines, migrations, automation.',
    detail:
      'ETL pipelines, spreadsheet-to-database migrations, workflow automation. Fixed quote after scoping.',
    baseEstimateZar: 8000,
    billing: 'scoped',
  },
  {
    id: 'grc',
    label: 'GRC ADVISORY',
    tagline: 'POPIA, policies, risk, audit prep.',
    detail:
      'Compliance gap analysis, plain-language policy drafting, risk registers, audit readiness. Scoped per engagement.',
    baseEstimateZar: 5000,
    billing: 'scoped',
  },
];

export type StyleId = 'minimal' | 'corporate' | 'bold-animated' | 'portfolio';

export interface StyleOption {
  id: StyleId;
  label: string;
  desc: string;
  // visual reference card rendering hints (terminal-styled mockup)
  preview: { accent: string; layout: string[] };
}

export const STYLE_OPTIONS: StyleOption[] = [
  {
    id: 'minimal',
    label: 'MINIMAL',
    desc: 'Clean lines, lots of whitespace, content does the talking.',
    preview: { accent: 'text-green-300', layout: ['w-3/4', 'w-1/2', 'w-2/3'] },
  },
  {
    id: 'corporate',
    label: 'CORPORATE',
    desc: 'Structured, trustworthy, built for credibility with bigger clients.',
    preview: { accent: 'text-blue-300', layout: ['w-full', 'w-full', 'w-5/6'] },
  },
  {
    id: 'bold-animated',
    label: 'BOLD / ANIMATED',
    desc: 'Motion, 3D, scroll effects \u2014 an experience, not a brochure.',
    preview: { accent: 'text-yellow-400', layout: ['w-2/3', 'w-1/2', 'w-3/4'] },
  },
  {
    id: 'portfolio',
    label: 'PORTFOLIO-FIRST',
    desc: 'Your work front and centre. Gallery-led, image-heavy.',
    preview: { accent: 'text-purple-300', layout: ['w-1/3', 'w-1/3', 'w-1/3'] },
  },
];

export type FeatureId =
  | 'three-d'
  | 'video-bg'
  | 'gallery'
  | 'blog'
  | 'seo'
  | 'contact-form'
  | 'crm-integration';

export interface FeatureOption {
  id: FeatureId;
  label: string;
  desc: string;
  estimateZar: number; // 0 = included
}

export const FEATURE_OPTIONS: FeatureOption[] = [
  {
    id: 'contact-form',
    label: 'CONTACT FORM',
    desc: 'Lead form wired to email + CRM capture. Included in every build.',
    estimateZar: 0,
  },
  {
    id: 'seo',
    label: 'SEO SETUP',
    desc: 'Metadata architecture, sitemap, Search Console, performance pass.',
    estimateZar: 1200,
  },
  {
    id: 'gallery',
    label: 'PHOTO GALLERY / PORTFOLIO',
    desc: 'Filterable gallery or case-study grid with CMS-backed content.',
    estimateZar: 1500,
  },
  {
    id: 'blog',
    label: 'BLOG',
    desc: 'CMS-backed writing space with categories and share-ready cards.',
    estimateZar: 2000,
  },
  {
    id: 'video-bg',
    label: 'VIDEO BACKGROUND',
    desc: 'Hero video loop, optimised for mobile data budgets.',
    estimateZar: 2500,
  },
  {
    id: 'crm-integration',
    label: 'CRM INTEGRATION',
    desc: 'Form and workflow data flowing into your CRM or client records.',
    estimateZar: 3500,
  },
  {
    id: 'three-d',
    label: '3D / INTERACTIVE ELEMENTS',
    desc: 'WebGL scenes, interactive product views, animated storytelling.',
    estimateZar: 6000,
  },
];

export interface ConfiguratorSelection {
  projectType: ProjectTypeId;
  style?: StyleId | null; // website only
  features: FeatureId[];
}

export interface PriceLineItem {
  label: string;
  amountZar: number;
}

export interface QuoteBreakdown {
  billing: BillingModel;
  lineItems: PriceLineItem[];
  totalZar: number;
}

const ZAR_FORMATTER = new Intl.NumberFormat('en-ZA', {
  style: 'currency',
  currency: 'ZAR',
  minimumFractionDigits: 0,
});

export function formatZar(amount: number): string {
  return ZAR_FORMATTER.format(amount).replace('ZAR', 'R').replace(/\u00a0/g, ' ');
}

/**
 * Authoritative quote calculation. Runs on the server for every submission
 * (client-side total is display-only).
 */
export function calculateQuote(selection: ConfiguratorSelection): QuoteBreakdown {
  const projectType =
    PROJECT_TYPES.find((t) => t.id === selection.projectType) ?? null;
  if (!projectType) {
    return { billing: 'scoped', lineItems: [], totalZar: 0 };
  }

  const lineItems: PriceLineItem[] = [
    { label: `${projectType.label} \u2014 BASE`, amountZar: projectType.baseEstimateZar },
  ];

  for (const featureId of selection.features ?? []) {
    const feature = FEATURE_OPTIONS.find((f) => f.id === featureId);
    if (!feature) continue;
    lineItems.push({
      label: feature.label,
      amountZar: feature.estimateZar,
    });
  }

  const totalZar = lineItems.reduce((sum, item) => sum + item.amountZar, 0);

  return {
    billing: projectType.billing,
    lineItems,
    totalZar,
  };
}

export function isValidSelection(input: unknown): input is ConfiguratorSelection {
  if (!input || typeof input !== 'object') return false;
  const s = input as Partial<ConfiguratorSelection>;
  if (!PROJECT_TYPES.some((t) => t.id === s.projectType)) return false;
  if (!Array.isArray(s.features)) return false;
  if (!s.features.every((f) => FEATURE_OPTIONS.some((opt) => opt.id === f))) return false;
  if (s.style != null && !STYLE_OPTIONS.some((st) => st.id === s.style)) return false;
  return true;
}
