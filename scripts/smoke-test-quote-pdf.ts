// Smoke test: generate a quote PDF to verify pdf-lib output is valid.
// Run: npx tsx scripts/smoke-test-quote-pdf.ts
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { generateQuotePdf } from '../src/lib/quote-pdf';
import { calculateQuote } from '../src/lib/configurator';

async function main() {
  const quote = calculateQuote({
    projectType: 'website',
    style: 'bold-animated',
    features: ['contact-form', 'seo', 'blog', 'three-d'],
  });

  const bytes = await generateQuotePdf({
    referenceId: 'TEST0001',
    createdAt: new Date(),
    contact: {
      name: 'Smoke Tester',
      email: 'smoke@test.co.za',
      phone: '+27 82 000 0000',
      company_name: 'Test (Pty) Ltd',
    },
    projectTypeId: 'website',
    styleId: 'bold-animated',
    features: ['contact-form', 'seo', 'blog', 'three-d'],
    notes:
      'We also need a client portal where customers can log in and view invoices.\nDeadline: before end of November if possible.',
    quote,
  });

  const out = join(__dirname, 'test-quote-output.pdf');
  writeFileSync(out, Buffer.from(bytes));
  const header = Buffer.from(bytes.slice(0, 5)).toString('ascii');
  console.log(`PDF header: ${header} | size: ${bytes.length} bytes | written to ${out}`);
  if (header !== '%PDF-') {
    throw new Error('Invalid PDF header');
  }
}

main().catch((err) => {
  console.error('SMOKE TEST FAILED:', err);
  process.exit(1);
});
