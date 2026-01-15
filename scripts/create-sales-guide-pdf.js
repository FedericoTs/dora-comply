/**
 * DORA Comply Sales Guide PDF Generator
 * Creates a professional PDF sales guide using PDFKit
 */

const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

// Brand colors - Emerald Theme (matching application globals.css)
const COLORS = {
  PRIMARY: '#059669',       // Emerald-600 (main brand color)
  PRIMARY_LIGHT: '#10B981', // Emerald-500
  DARK: '#111827',          // Gray-900
  LIGHT_GRAY: '#F8FAFC',
  TEXT: '#334155',
  GRAY: '#64748B',
  SUCCESS: '#10B981',
  WARNING: '#F59E0B',
  ERROR: '#EF4444',
  INFO: '#3B82F6'
};

function createSalesGuide() {
  console.log('Creating DORA Comply Sales Guide PDF...\n');

  const doc = new PDFDocument({
    size: 'A4',
    margins: { top: 50, bottom: 50, left: 50, right: 50 },
    info: {
      Title: 'DORA Comply - Sales Guide',
      Author: 'DORA Comply',
      Subject: 'AI-Powered Third-Party Risk Management for EU Financial Institutions',
      Keywords: 'DORA, compliance, third-party risk, ICT, financial services'
    }
  });

  const outputPath = path.join(__dirname, 'DORA-Comply-Sales-Guide.pdf');
  const writeStream = fs.createWriteStream(outputPath);
  doc.pipe(writeStream);

  // ========================================
  // Cover Page
  // ========================================
  console.log('Creating cover page...');

  // Header bar
  doc.rect(0, 0, doc.page.width, 15).fill(COLORS.PRIMARY);

  // Logo area
  doc.fontSize(48)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('DORA Comply', 50, 200, { align: 'center' });

  doc.fontSize(18)
     .fillColor(COLORS.GRAY)
     .font('Helvetica')
     .text('AI-Powered Third-Party Risk Management', 50, 270, { align: 'center' })
     .text('for EU Financial Institutions', 50, 295, { align: 'center' });

  // Deadline box
  doc.roundedRect(150, 380, 300, 50, 8)
     .lineWidth(2)
     .stroke(COLORS.PRIMARY);

  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('DORA Enforcement: January 17, 2025', 150, 398, { width: 300, align: 'center' });

  // Features list
  doc.fontSize(12)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('Automated Compliance  •  Register of Information  •  Incident Reporting', 50, 500, { align: 'center' });

  // Footer
  doc.fontSize(10)
     .fillColor(COLORS.GRAY)
     .text('www.doracomply.eu', 50, 750, { align: 'center' });

  // ========================================
  // Page 2: Executive Summary
  // ========================================
  doc.addPage();
  console.log('Creating executive summary...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Executive Summary', 50, 30);

  doc.fillColor(COLORS.TEXT)
     .font('Helvetica')
     .fontSize(11);

  let y = 110;

  doc.text('DORA Comply is the first AI-powered compliance platform purpose-built for the Digital Operational Resilience Act (DORA). While generic GRC tools struggle to adapt, DORA Comply delivers complete regulatory compliance from day one.', 50, y, { width: 495, lineGap: 4 });

  y += 80;

  // Key benefits
  doc.fontSize(16)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Key Benefits', 50, y);

  y += 30;

  const benefits = [
    { title: '98% Time Reduction', desc: 'Automate manual vendor assessments that previously took 40+ hours each' },
    { title: '60-Second Document Parsing', desc: 'AI extracts compliance data from SOC 2 and ISO reports in under a minute' },
    { title: 'Complete ESA Coverage', desc: 'All 15 Register of Information templates auto-populated and export-ready' },
    { title: 'Zero Gap Implementation', desc: 'Purpose-built for DORA with native Article 30 mapping' }
  ];

  benefits.forEach(benefit => {
    doc.fontSize(12)
       .fillColor(COLORS.DARK)
       .font('Helvetica-Bold')
       .text(benefit.title, 50, y);

    y += 16;

    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text(benefit.desc, 50, y, { width: 495 });

    y += 28;
  });

  y += 20;

  // Target audience
  doc.fontSize(16)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Who Is This For?', 50, y);

  y += 25;

  const audiences = [
    'Chief Risk Officers (CROs) at banks and investment firms',
    'Compliance Officers managing vendor relationships',
    'IT Security teams responsible for ICT resilience',
    'Third-Party Risk Managers overseeing supplier contracts'
  ];

  audiences.forEach(audience => {
    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text('• ' + audience, 60, y, { width: 485 });
    y += 18;
  });

  // ========================================
  // Page 3: The DORA Challenge
  // ========================================
  doc.addPage();
  console.log('Creating DORA challenge page...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('The DORA Challenge', 50, 30);

  y = 110;

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('The Digital Operational Resilience Act (DORA) introduces the most comprehensive ICT risk management requirements ever imposed on EU financial institutions. Compliance is not optional - enforcement begins January 17, 2025.', 50, y, { width: 495, lineGap: 4 });

  y += 70;

  // Pain points
  doc.fontSize(16)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Key Pain Points', 50, y);

  y += 25;

  const painPoints = [
    { problem: 'Manual Vendor Assessments', impact: 'Each assessment takes 40+ hours of analyst time' },
    { problem: 'Register of Information', impact: '15 complex ESA templates with thousands of fields' },
    { problem: 'Incident Reporting Deadlines', impact: '4-hour initial notification requirement' },
    { problem: '4th Party Visibility', impact: 'No insight into subcontractor risks in ICT supply chain' },
    { problem: 'Concentration Risk', impact: 'Unable to quantify exposure to critical ICT providers' },
    { problem: 'Cross-Framework Mapping', impact: 'DORA, SOC 2, ISO 27001 controls not aligned' }
  ];

  painPoints.forEach(point => {
    // Red indicator
    doc.rect(50, y, 4, 35).fill(COLORS.ERROR);

    doc.fontSize(11)
       .fillColor(COLORS.DARK)
       .font('Helvetica-Bold')
       .text(point.problem, 62, y + 2);

    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text(point.impact, 62, y + 18);

    y += 45;
  });

  y += 20;

  // Stats
  doc.fontSize(16)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('The Numbers Speak', 50, y);

  y += 30;

  // Stat boxes
  const stats = [
    { value: '250+', label: 'Hours per vendor for manual compliance' },
    { value: '€10M+', label: 'Potential fines for non-compliance' },
    { value: '5,000+', label: 'Fields across all 15 ESA templates' }
  ];

  let statX = 50;
  stats.forEach((stat, i) => {
    doc.roundedRect(statX, y, 155, 70, 5).fill(COLORS.DARK);

    doc.fontSize(24)
       .fillColor(COLORS.PRIMARY)
       .font('Helvetica-Bold')
       .text(stat.value, statX, y + 12, { width: 155, align: 'center' });

    doc.fontSize(9)
       .fillColor('#94A3B8')
       .font('Helvetica')
       .text(stat.label, statX + 10, y + 45, { width: 135, align: 'center' });

    statX += 170;
  });

  // ========================================
  // Page 4: Our Solution
  // ========================================
  doc.addPage();
  console.log('Creating solution overview...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Our Solution', 50, 30);

  y = 110;

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('DORA Comply is an end-to-end platform that automates the most time-consuming aspects of DORA compliance while ensuring complete regulatory alignment.', 50, y, { width: 495, lineGap: 4 });

  y += 60;

  // Core modules
  const modules = [
    {
      title: 'AI Document Parsing',
      features: [
        'Upload SOC 2, ISO 27001, ISO 22301, PCI DSS reports',
        'Claude AI extracts controls in under 60 seconds',
        'Automatic mapping to DORA Article 30 provisions',
        '4th party (subservice organization) detection',
        'Control gap identification and risk flagging'
      ]
    },
    {
      title: 'Register of Information (RoI)',
      features: [
        'All 15 ESA-mandated templates pre-built',
        'Auto-population from vendor profiles',
        'Real-time validation against ESA schema',
        'One-click CSV/Excel export for regulators',
        'Version history and audit trail'
      ]
    },
    {
      title: 'ICT Incident Reporting',
      features: [
        'Article 19 compliant reporting workflow',
        '4-hour / 72-hour / 1-month deadline tracking',
        'Smart classification (Critical/Major/Minor)',
        'Pre-built ESA report templates',
        'Automated escalation notifications'
      ]
    },
    {
      title: 'Vendor Risk Management',
      features: [
        'Centralized vendor registry with tiering',
        'Contract lifecycle management',
        'Certification tracking and expiry alerts',
        'Concentration risk analytics (HHI index)',
        'Cross-framework control mapping'
      ]
    }
  ];

  modules.forEach(module => {
    doc.fontSize(14)
       .fillColor(COLORS.PRIMARY)
       .font('Helvetica-Bold')
       .text(module.title, 50, y);

    y += 22;

    module.features.forEach(feature => {
      doc.fontSize(10)
         .fillColor(COLORS.TEXT)
         .font('Helvetica')
         .text('• ' + feature, 60, y);
      y += 15;
    });

    y += 15;
  });

  // ========================================
  // Page 5: Register of Information Details
  // ========================================
  doc.addPage();
  console.log('Creating RoI details page...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Register of Information', 50, 30);

  y = 110;

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('DORA Article 28(3) requires financial entities to maintain a comprehensive Register of Information for all ICT third-party arrangements. DORA Comply supports all 15 ESA-mandated templates:', 50, y, { width: 495, lineGap: 4 });

  y += 60;

  // Template list
  const templates = [
    { code: 'RT.01.01', name: 'Entity maintaining the register of information' },
    { code: 'RT.02.01', name: 'List of contractual arrangements' },
    { code: 'RT.02.02', name: 'Specific contractual arrangements' },
    { code: 'RT.02.03', name: 'Intragroup contractual arrangements' },
    { code: 'RT.03.01', name: 'List of ICT third-party service providers' },
    { code: 'RT.03.02', name: 'Entities using the ICT services' },
    { code: 'RT.03.03', name: 'Branches of the ICT third-party service provider' },
    { code: 'RT.04.01', name: 'List of ICT subcontractors (4th parties)' },
    { code: 'RT.05.01', name: 'Identification of functions' },
    { code: 'RT.05.02', name: 'ICT services supporting functions' },
    { code: 'RT.06.01', name: 'Assessment of ICT concentration risk' },
    { code: 'RT.07.01', name: 'Entities within the scope' },
    { code: 'RT.08.01', name: 'Cost information' },
    { code: 'RT.99.01', name: 'Code lists (standard values)' },
    { code: 'RT.99.02', name: 'Country codes (ISO 3166)' }
  ];

  // Create two columns
  const col1Templates = templates.slice(0, 8);
  const col2Templates = templates.slice(8);

  let col1Y = y;
  let col2Y = y;

  col1Templates.forEach(template => {
    doc.fontSize(10)
       .fillColor(COLORS.PRIMARY)
       .font('Helvetica-Bold')
       .text(template.code, 50, col1Y);

    doc.fontSize(9)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text(template.name, 50, col1Y + 12, { width: 220 });

    col1Y += 35;
  });

  col2Templates.forEach(template => {
    doc.fontSize(10)
       .fillColor(COLORS.PRIMARY)
       .font('Helvetica-Bold')
       .text(template.code, 300, col2Y);

    doc.fontSize(9)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text(template.name, 300, col2Y + 12, { width: 220 });

    col2Y += 35;
  });

  y = Math.max(col1Y, col2Y) + 20;

  // Key features
  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Key RoI Features', 50, y);

  y += 25;

  const roiFeatures = [
    'Auto-population: Data flows automatically from vendor profiles to all templates',
    'Validation engine: Real-time checks against ESA schema requirements',
    'Export options: One-click CSV or Excel download for regulator submission',
    'Version control: Complete audit trail of all changes'
  ];

  roiFeatures.forEach(feature => {
    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text('✓ ' + feature, 50, y, { width: 495 });
    y += 20;
  });

  // ========================================
  // Page 6: Competitive Comparison
  // ========================================
  doc.addPage();
  console.log('Creating competitive comparison...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Why DORA Comply?', 50, 30);

  y = 110;

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('Unlike generic GRC platforms that require extensive customization, DORA Comply is purpose-built for DORA compliance from the ground up.', 50, y, { width: 495, lineGap: 4 });

  y += 50;

  // Comparison table
  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Feature Comparison', 50, y);

  y += 25;

  // Table header
  doc.rect(50, y, 445, 25).fill(COLORS.DARK);
  doc.fontSize(10)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Feature', 60, y + 7)
     .fillColor(COLORS.PRIMARY)
     .text('DORA Comply', 200, y + 7)
     .fillColor('#FFFFFF')
     .text('Generic GRC', 310, y + 7)
     .text('Manual', 420, y + 7);

  y += 25;

  const comparisons = [
    { feature: 'AI Document Parsing', us: 'Yes - 60s', them: 'No', manual: 'No' },
    { feature: '15 ESA RoI Templates', us: 'All 15', them: 'Partial', manual: 'Manual' },
    { feature: '4th Party Detection', us: 'Automatic', them: 'No', manual: 'No' },
    { feature: 'DORA Article Mapping', us: 'Native', them: 'Generic', manual: 'No' },
    { feature: 'Incident Timeline (4h/72h/1m)', us: 'Built-in', them: 'Basic', manual: 'No' },
    { feature: 'Time to Value', us: 'Days', them: 'Months', manual: 'Years' },
    { feature: 'Customization Required', us: 'None', them: 'Extensive', manual: 'N/A' }
  ];

  comparisons.forEach((row, i) => {
    const bgColor = i % 2 === 0 ? COLORS.LIGHT_GRAY : '#FFFFFF';
    doc.rect(50, y, 445, 25).fill(bgColor);

    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text(row.feature, 60, y + 7)
       .fillColor(COLORS.SUCCESS)
       .font('Helvetica-Bold')
       .text(row.us, 200, y + 7)
       .fillColor(row.them === 'No' ? COLORS.ERROR : COLORS.WARNING)
       .font('Helvetica')
       .text(row.them, 310, y + 7)
       .fillColor(row.manual === 'No' ? COLORS.ERROR : COLORS.WARNING)
       .text(row.manual, 420, y + 7);

    y += 25;
  });

  y += 30;

  // Key differentiators
  doc.fontSize(14)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('Key Differentiators', 50, y);

  y += 25;

  const differentiators = [
    'Purpose-built: Designed specifically for DORA, not retrofitted from generic GRC',
    'AI-powered: Claude AI understands compliance documents like a human analyst',
    'Complete coverage: All Article 30 provisions and ESA templates from day one',
    'Fast implementation: Go live in days, not months of professional services'
  ];

  differentiators.forEach(diff => {
    doc.fontSize(10)
       .fillColor(COLORS.TEXT)
       .font('Helvetica')
       .text('▸ ' + diff, 50, y, { width: 495 });
    y += 20;
  });

  // ========================================
  // Page 7: Pricing
  // ========================================
  doc.addPage();
  console.log('Creating pricing page...');

  // Header
  doc.rect(0, 0, doc.page.width, 80).fill(COLORS.DARK);
  doc.fontSize(28)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Pricing Plans', 50, 30);

  y = 110;

  doc.fontSize(11)
     .fillColor(COLORS.TEXT)
     .font('Helvetica')
     .text('Simple, transparent pricing that scales with your compliance needs. All plans include a 14-day free trial.', 50, y, { width: 495 });

  y += 50;

  // Pricing cards
  const plans = [
    {
      name: 'Starter',
      price: '$499',
      period: '/month',
      features: [
        'Up to 25 vendors',
        '5 AI document parses/month',
        'Basic RoI export',
        'Incident tracking',
        'Email support'
      ],
      highlight: false
    },
    {
      name: 'Professional',
      price: '$1,499',
      period: '/month',
      features: [
        'Up to 100 vendors',
        'Unlimited AI parsing',
        'Full 15-template RoI',
        '4th party detection',
        'Cross-framework mapping',
        'Priority support'
      ],
      highlight: true
    },
    {
      name: 'Enterprise',
      price: 'Custom',
      period: 'contact us',
      features: [
        'Unlimited vendors',
        'Unlimited AI parsing',
        'Custom integrations',
        'SSO / SAML',
        'Dedicated CSM',
        'On-premise option'
      ],
      highlight: false
    }
  ];

  let cardX = 50;
  plans.forEach(plan => {
    // Card border
    if (plan.highlight) {
      doc.roundedRect(cardX, y, 150, 280, 8)
         .lineWidth(2)
         .stroke(COLORS.PRIMARY);
    } else {
      doc.roundedRect(cardX, y, 150, 280, 8)
         .lineWidth(1)
         .stroke('#E2E8F0');
    }

    // Header
    const headerColor = plan.highlight ? COLORS.PRIMARY : COLORS.LIGHT_GRAY;
    doc.rect(cardX, y, 150, 70).fill(headerColor);

    doc.fontSize(14)
       .fillColor(plan.highlight ? '#FFFFFF' : COLORS.DARK)
       .font('Helvetica-Bold')
       .text(plan.name, cardX, y + 12, { width: 150, align: 'center' });

    doc.fontSize(24)
       .fillColor(plan.highlight ? '#FFFFFF' : COLORS.PRIMARY)
       .text(plan.price, cardX, y + 32, { width: 150, align: 'center' });

    doc.fontSize(10)
       .fillColor(plan.highlight ? '#FFFFFFCC' : COLORS.GRAY)
       .font('Helvetica')
       .text(plan.period, cardX, y + 56, { width: 150, align: 'center' });

    // Features
    let featureY = y + 85;
    plan.features.forEach(feature => {
      doc.fontSize(9)
         .fillColor(COLORS.TEXT)
         .font('Helvetica')
         .text('• ' + feature, cardX + 12, featureY, { width: 126 });
      featureY += 18;
    });

    cardX += 165;
  });

  y += 310;

  // Notes
  doc.fontSize(10)
     .fillColor(COLORS.GRAY)
     .font('Helvetica')
     .text('All prices in USD. Annual billing available with 20% discount.', 50, y, { align: 'center', width: 495 });

  // ========================================
  // Page 8: Call to Action
  // ========================================
  doc.addPage();
  console.log('Creating call to action...');

  // Full page dark background
  doc.rect(0, 0, doc.page.width, doc.page.height).fill(COLORS.DARK);

  // Header bar
  doc.rect(0, 0, doc.page.width, 15).fill(COLORS.PRIMARY);

  // Main CTA
  doc.fontSize(36)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Ready for DORA\nCompliance?', 50, 200, { align: 'center', width: 495 });

  doc.fontSize(18)
     .fillColor('#94A3B8')
     .font('Helvetica')
     .text('Start your 14-day free trial today', 50, 300, { align: 'center', width: 495 });

  // Deadline warning
  doc.roundedRect(120, 360, 350, 45, 8)
     .lineWidth(1)
     .stroke(COLORS.ERROR);

  doc.fontSize(12)
     .fillColor('#FCA5A5')
     .font('Helvetica')
     .text('Only 12 months until DORA enforcement - January 17, 2025', 120, 375, { width: 350, align: 'center' });

  // CTA buttons (styled as text since PDF doesn't have real buttons)
  doc.roundedRect(140, 440, 150, 45, 8).fill(COLORS.PRIMARY);
  doc.fontSize(14)
     .fillColor('#FFFFFF')
     .font('Helvetica-Bold')
     .text('Start Free Trial', 140, 455, { width: 150, align: 'center' });

  doc.roundedRect(310, 440, 150, 45, 8)
     .lineWidth(2)
     .stroke('#475569');
  doc.fontSize(14)
     .fillColor('#94A3B8')
     .font('Helvetica-Bold')
     .text('Schedule Demo', 310, 455, { width: 150, align: 'center' });

  // Contact info
  doc.fontSize(11)
     .fillColor(COLORS.GRAY)
     .font('Helvetica')
     .text('Email', 150, 530, { width: 130, align: 'center' })
     .text('Website', 320, 530, { width: 130, align: 'center' });

  doc.fontSize(13)
     .fillColor(COLORS.PRIMARY)
     .font('Helvetica-Bold')
     .text('sales@doracomply.eu', 150, 548, { width: 130, align: 'center' })
     .text('www.doracomply.eu', 320, 548, { width: 130, align: 'center' });

  // Footer
  doc.fontSize(10)
     .fillColor('#475569')
     .font('Helvetica')
     .text('DORA Comply - AI-Powered Compliance for EU Financial Institutions', 50, 750, { align: 'center', width: 495 });

  // Finalize
  doc.end();

  writeStream.on('finish', () => {
    console.log(`\n✓ PDF saved to: ${outputPath}`);
    console.log('\n=== Document Contents ===');
    console.log('  1. Cover Page');
    console.log('  2. Executive Summary');
    console.log('  3. The DORA Challenge');
    console.log('  4. Our Solution');
    console.log('  5. Register of Information Details');
    console.log('  6. Competitive Comparison');
    console.log('  7. Pricing Plans');
    console.log('  8. Call to Action');
  });
}

createSalesGuide();
