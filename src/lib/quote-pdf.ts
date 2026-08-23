// ============================================================
// QUOTE PDF — scope-of-work summary for /configure submissions.
// Generated server-side with pdf-lib (no native deps).
// This document protects both sides: it records exactly what was
// selected and states clearly that prices are ESTIMATES pending
// final consultation — not a binding quote.
// ============================================================

import { PDFDocument, StandardFonts, rgb, type PDFFont } from 'pdf-lib';
import {
  formatZar,
  PROJECT_TYPES,
  STYLE_OPTIONS,
  FEATURE_OPTIONS,
  type QuoteBreakdown,
} from './configurator';

export interface QuotePdfInput {
  referenceId: string;
  createdAt: Date;
  contact: { name: string; email: string; phone?: string | null; company_name?: string | null };
  projectTypeId: string;
  styleId?: string | null;
  features: string[];
  notes?: string | null;
  quote: QuoteBreakdown;
}

const M4N_GREEN = rgb(0.13, 0.77, 0.41);
const M4N_YELLOW = rgb(0.98, 0.8, 0.08);
const DARK = rgb(0.1, 0.1, 0.1);
const GRAY = rgb(0.45, 0.45, 0.45);

export async function generateQuotePdf(input: QuotePdfInput): Promise<Uint8Array> {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);
  const mono = await pdf.embedFont(StandardFonts.Courier);

  const pageW = 595.28; // A4
  const pageH = 841.89;
  const margin = 56;
  let y = pageH - margin;

  // pdf-lib documents start with no pages — add the first one.
  pdf.addPage([pageW, pageH]);

  const newPage = () => {
    drawFooter(pdf.getPages()[pdf.getPages().length - 1], bold, font);
    const p = pdf.addPage([pageW, pageH]);
    y = pageH - margin;
    return p;
  };

  const ensureSpace = (needed: number) => {
    if (y - needed < margin + 60) newPage();
  };

  const pages = () => pdf.getPages();
  const lastPage = () => pages()[pages().length - 1];

  // ---- Header band ----
  {
    const page = lastPage();
    page.drawRectangle({ x: 0, y: pageH - 90, width: pageW, height: 90, color: DARK });
    page.drawText('M4N', { x: margin, y: pageH - 52, size: 30, font: bold, color: M4N_GREEN });
    page.drawText('SECURE INTELLIGENT SYSTEMS', {
      x: margin + 92,
      y: pageH - 40,
      size: 10,
      font: bold,
      color: M4N_YELLOW,
    });
    page.drawText('m4n.co.za | owen@m4n.co.za', {
      x: margin + 92,
      y: pageH - 56,
      size: 9,
      font: mono,
      color: GRAY,
    });
    page.drawText('PROJECT CONFIGURATOR — SCOPE SUMMARY', {
      x: margin + 92,
      y: pageH - 72,
      size: 9,
      font: bold,
      color: rgb(0.85, 0.85, 0.85),
    });
    y = pageH - 120;
  }

  const sectionTitle = (title: string) => {
    ensureSpace(34);
    const page = lastPage();
    page.drawText(title, { x: margin, y, size: 11, font: bold, color: M4N_YELLOW });
    y -= 8;
    page.drawLine({
      start: { x: margin, y },
      end: { x: pageW - margin, y },
      thickness: 0.7,
      color: rgb(0.3, 0.5, 0.38),
    });
    y -= 16;
  };

  const wrapText = (text: string, size: number, f: typeof font, maxWidth: number): string[] => {
    const words = text.split(/\s+/).filter(Boolean);
    const lines: string[] = [];
    let current = '';
    for (const word of words) {
      const candidate = current ? `${current} ${word}` : word;
      if (f.widthOfTextAtSize(candidate, size) <= maxWidth) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = word;
      }
    }
    if (current) lines.push(current);
    return lines.length > 0 ? lines : [''];
  };

  const field = (label: string, value: string) => {
    ensureSpace(18);
    const page = lastPage();
    page.drawText(`${label}:`, { x: margin, y, size: 10, font: bold, color: DARK });
    const labelW = bold.widthOfTextAtSize(`${label}: `, 10);
    const maxVal = pageW - margin * 2 - labelW;
    const lines = wrapText(value || '—', 10, font, maxVal);
    lines.forEach((line, i) => {
      page.drawText(line, { x: margin + labelW, y: y - i * 14, size: 10, font, color: DARK });
    });
    y -= lines.length * 14;
  };

  const bodyLine = (text: string, opts?: { size?: number; color?: typeof DARK; indent?: number }) => {
    const size = opts?.size ?? 10;
    const indent = opts?.indent ?? 0;
    const lines = wrapText(text, size, font, pageW - margin * 2 - indent);
    for (const line of lines) {
      ensureSpace(16);
      lastPage().drawText(line, {
        x: margin + indent,
        y,
        size,
        font: opts?.color === GRAY ? mono : font,
        color: opts?.color ?? DARK,
      });
      y -= size + 4;
    }
  };

  // ---- Meta ----
  sectionTitle('REFERENCE');
  field('Reference', input.referenceId);
  field('Date', input.createdAt.toLocaleDateString('en-ZA', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }));

  // ---- Client ----
  sectionTitle('CLIENT');
  field('Name', input.contact.name);
  field('Email', input.contact.email);
  if (input.contact.phone) field('Phone', input.contact.phone);
  if (input.contact.company_name) field('Company', input.contact.company_name);

  // ---- Selections ----
  sectionTitle('PROJECT SELECTION');
  const typeLabel =
    PROJECT_TYPES.find((t) => t.id === input.projectTypeId)?.label ?? input.projectTypeId;
  field('Project type', typeLabel);
  if (input.styleId) {
    field(
      'Style / vibe',
      STYLE_OPTIONS.find((s) => s.id === input.styleId)?.label ?? input.styleId
    );
  }

  ensureSpace(24 + Math.max(input.features.length, 1) * 16);
  lastPage().drawText('Selected features:', { x: margin, y, size: 10, font: bold, color: DARK });
  y -= 15;
  if (input.features.length === 0) {
    bodyLine('(none selected)', { color: GRAY });
  } else {
    for (const featureId of input.features) {
      const label = FEATURE_OPTIONS.find((f) => f.id === featureId)?.label ?? featureId;
      bodyLine(`[x] ${label}`, {});
    }
  }
  y -= 6;

  if (input.notes && input.notes.trim().length > 0) {
    ensureSpace(60);
    sectionTitle('CLIENT NOTES');
    const noteLines = input.notes.trim().split('\n');
    for (const rawLine of noteLines.slice(0, 40)) {
      bodyLine(rawLine, { color: GRAY });
    }
  }

  // ---- Price breakdown ----
  ensureSpace(80 + input.quote.lineItems.length * 20);
  sectionTitle(
    `ESTIMATED PRICE${input.quote.billing === 'monthly' ? ' (PER MONTH)' : ''}`
  );
  for (const item of input.quote.lineItems) {
    ensureSpace(20);
    const amount = formatZar(item.amountZar);
    const page = lastPage();
    page.drawText(`- ${item.label}`, { x: margin, y, size: 10, font, color: DARK });
    const amountW = bold.widthOfTextAtSize(amount, 10);
    page.drawText(item.amountZar === 0 ? 'INCLUDED' : amount, {
      x: pageW - margin - amountW,
      y,
      size: 10,
      font: bold,
      color: item.amountZar === 0 ? M4N_GREEN : DARK,
    });
    y -= 16;
  }

  if (input.quote.monthlyRetainerZar && input.quote.monthlyRetainerZar > 0) {
    ensureSpace(20);
    const retainerStr = `${formatZar(input.quote.monthlyRetainerZar)} / MONTH`;
    const page = lastPage();
    page.drawText('- HOSTING & MAINTENANCE RETAINER', {
      x: margin,
      y,
      size: 10,
      font,
      color: DARK,
    });
    const w = bold.widthOfTextAtSize(retainerStr, 10);
    page.drawText(retainerStr, {
      x: pageW - margin - w,
      y,
      size: 10,
      font: bold,
      color: M4N_YELLOW,
    });
    y -= 16;
  }

  y -= 4;
  ensureSpace(26);
  {
    const page = lastPage();
    page.drawRectangle({
      x: margin - 8,
      y: y - 22,
      width: pageW - margin * 2 + 16,
      height: 26,
      color: rgb(0.94, 0.97, 0.95),
      borderColor: M4N_GREEN,
      borderWidth: 0.8,
    });
    const totalLabel =
      input.quote.billing === 'monthly'
        ? 'ESTIMATED TOTAL PER MONTH:'
        : input.quote.billing === 'scoped'
          ? 'ESTIMATED TOTAL (SCOPED):'
          : 'ESTIMATED TOTAL:';
    page.drawText(totalLabel, { x: margin, y: y - 14, size: 11, font: bold, color: DARK });
    const totalStr = formatZar(input.quote.totalZar);
    const totalW = bold.widthOfTextAtSize(totalStr, 12);
    page.drawText(totalStr, {
      x: pageW - margin - totalW,
      y: y - 15,
      size: 12,
      font: bold,
      color: M4N_GREEN,
    });
    y -= 44;
  }

  // ---- Estimate disclaimer ----
  ensureSpace(70);
  sectionTitle('IMPORTANT — THIS IS NOT A BINDING QUOTE');
  bodyLine(
    'This is an estimate based on your selections. Final scope and price confirmed after a consultation.',
    {}
  );
  y -= 2;
  bodyLine(
    'Prices are indicative planning figures in ZAR, generated from your configurator selections at the time of submission. They do not constitute a binding quotation or agreement. Any engagement proceeds only after a consultation and a written, signed scope of work.',
    { color: GRAY }
  );

  drawFooter(lastPage(), bold, font);

  return pdf.save();
}

function drawFooter(
  page: ReturnType<PDFDocument['getPages']>[number],
  bold: PDFFont,
  oblique: PDFFont
) {
  const pageW = 595.28;
  const gray = GRAY;
  page.drawLine({
    start: { x: 56, y: 64 },
    end: { x: pageW - 56, y: 64 },
    thickness: 0.7,
    color: rgb(0.3, 0.5, 0.38),
  });
  page.drawText(
    'This is an estimate based on your selections. Final scope and price confirmed after a consultation.',
    { x: 56, y: 48, size: 8, font: oblique, color: gray }
  );
  page.drawText('m4n.co.za', {
    x: 56,
    y: 36,
    size: 8,
    font: bold,
    color: M4N_GREEN,
  });
}
