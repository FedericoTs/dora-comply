/**
 * DORA Comply Sales Presentation Generator
 * Converts HTML slides to PowerPoint using html2pptx
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

// Import html2pptx from the skill directory
const html2pptx = require('/home/fede/.claude/plugins/cache/anthropic-agent-skills/example-skills/ef740771ac90/skills/pptx/scripts/html2pptx.js');

async function createPresentation() {
  console.log('Creating DORA Comply Sales Presentation...\n');

  const pptx = new pptxgen();

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'DORA Comply - Sales Presentation';
  pptx.subject = 'AI-Powered Third-Party Risk Management for EU Financial Institutions';
  pptx.author = 'DORA Comply';
  pptx.company = 'DORA Comply';

  // Define slide files in order
  const slideFiles = [
    'slide-01-cover.html',
    'slide-02-problem.html',
    'slide-03-solution.html',
    'slide-04-ai-parsing.html',
    'slide-05-roi.html',
    'slide-06-incidents.html',
    'slide-07-tprm.html',
    'slide-08-competitive.html',
    'slide-09-pricing.html',
    'slide-10-cta.html'
  ];

  const slideDir = __dirname;

  // Process each slide
  for (let i = 0; i < slideFiles.length; i++) {
    const slideFile = slideFiles[i];
    const slidePath = path.join(slideDir, slideFile);

    console.log(`Processing slide ${i + 1}/${slideFiles.length}: ${slideFile}`);

    try {
      await html2pptx(slidePath, pptx);
      console.log(`  ✓ Slide ${i + 1} created successfully`);
    } catch (error) {
      console.error(`  ✗ Error processing ${slideFile}:`, error.message);
      throw error;
    }
  }

  // Save the presentation
  const outputPath = path.join(slideDir, '..', 'DORA-Comply-Sales-Presentation.pptx');

  console.log('\nSaving presentation...');
  await pptx.writeFile({ fileName: outputPath });

  console.log(`\n✓ Presentation saved to: ${outputPath}`);
  console.log('\nPresentation Contents:');
  console.log('  1. Cover - DORA Comply Introduction');
  console.log('  2. Problem - The DORA Compliance Challenge');
  console.log('  3. Solution - Platform Overview');
  console.log('  4. AI Document Parsing');
  console.log('  5. Register of Information');
  console.log('  6. ICT Incident Reporting');
  console.log('  7. Third-Party Risk Management');
  console.log('  8. Competitive Comparison');
  console.log('  9. Pricing Plans');
  console.log('  10. Call to Action');
}

createPresentation().catch(err => {
  console.error('Failed to create presentation:', err);
  process.exit(1);
});
