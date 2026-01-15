/**
 * DORA Comply Sales Presentation Generator
 * Creates PowerPoint directly using PptxGenJS
 */

const pptxgen = require('pptxgenjs');
const path = require('path');

// Brand colors (without # prefix for pptxgenjs) - Emerald Theme
const COLORS = {
  PRIMARY: '059669',       // Emerald-600 (main brand color)
  PRIMARY_LIGHT: '10B981', // Emerald-500
  DARK: '111827',          // Gray-900
  WHITE: 'FFFFFF',
  LIGHT_GRAY: 'F8FAFC',
  GRAY: '94A3B8',
  DARK_GRAY: '64748B',
  TEXT: '334155',
  SUCCESS: '10B981',
  WARNING: 'F59E0B',
  ERROR: 'EF4444',
  INFO: '3B82F6',
  BORDER: 'E2E8F0'
};

async function createPresentation() {
  console.log('Creating DORA Comply Sales Presentation...\n');

  const pptx = new pptxgen();

  // Set presentation properties
  pptx.layout = 'LAYOUT_16x9';
  pptx.title = 'DORA Comply - Sales Presentation';
  pptx.subject = 'AI-Powered Third-Party Risk Management';
  pptx.author = 'DORA Comply';
  pptx.company = 'DORA Comply';

  // ========================================
  // Slide 1: Cover
  // ========================================
  console.log('Creating slide 1: Cover');
  let slide = pptx.addSlide();
  slide.background = { color: COLORS.DARK };

  // Header bar
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: COLORS.PRIMARY }
  });

  // Logo/Title
  slide.addText('DORA Comply', {
    x: 0, y: 1.8, w: '100%', h: 0.8,
    fontSize: 48, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
    align: 'center'
  });

  // Tagline
  slide.addText('AI-Powered Third-Party Risk Management\nfor EU Financial Institutions', {
    x: 0, y: 2.7, w: '100%', h: 0.8,
    fontSize: 20, fontFace: 'Arial', color: COLORS.GRAY,
    align: 'center'
  });

  // Deadline box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 3.5, y: 3.6, w: 3, h: 0.6,
    fill: { color: COLORS.DARK },
    line: { color: COLORS.PRIMARY, width: 2 },
    rectRadius: 0.1
  });
  slide.addText('DORA Enforcement: January 17, 2025', {
    x: 3.5, y: 3.6, w: 3, h: 0.6,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
    align: 'center', valign: 'middle'
  });

  // Footer
  slide.addText('Automated Compliance  |  Register of Information  |  Incident Reporting', {
    x: 0, y: 4.8, w: '100%', h: 0.4,
    fontSize: 11, fontFace: 'Arial', color: COLORS.DARK_GRAY,
    align: 'center'
  });

  // ========================================
  // Slide 2: The Problem
  // ========================================
  console.log('Creating slide 2: The Problem');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.LIGHT_GRAY };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('The DORA Compliance Challenge', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Financial institutions face unprecedented regulatory pressure', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Pain points
  const painPoints = [
    'Manual vendor assessments take 40+ hours each',
    'Register of Information requires 15 complex ESA templates',
    'Incident reports due within 4 hours of detection',
    'No visibility into 4th party (subcontractor) risks',
    'Concentration risk across critical ICT providers'
  ];

  painPoints.forEach((point, i) => {
    const y = 1.4 + i * 0.55;
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: y, w: 5.8, h: 0.45,
      fill: { color: COLORS.WHITE },
      line: { color: COLORS.BORDER, width: 0.5 }
    });
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: 0.5, y: y, w: 0.08, h: 0.45,
      fill: { color: COLORS.ERROR }
    });
    slide.addText(point, {
      x: 0.7, y: y, w: 5.5, h: 0.45,
      fontSize: 12, fontFace: 'Arial', color: COLORS.TEXT,
      valign: 'middle'
    });
  });

  // Stats boxes
  const stats = [
    { value: '250+', label: 'Hours per vendor\nfor manual compliance' },
    { value: '15', label: 'ESA templates\nmandatory for RoI' },
    { value: '4h', label: 'Deadline for initial\nincident notification' }
  ];

  stats.forEach((stat, i) => {
    const y = 1.4 + i * 1.1;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 7, y: y, w: 2.5, h: 0.95,
      fill: { color: COLORS.DARK },
      rectRadius: 0.1
    });
    slide.addText(stat.value, {
      x: 7, y: y + 0.1, w: 2.5, h: 0.4,
      fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
      align: 'center'
    });
    slide.addText(stat.label, {
      x: 7, y: y + 0.5, w: 2.5, h: 0.4,
      fontSize: 9, fontFace: 'Arial', color: COLORS.GRAY,
      align: 'center'
    });
  });

  // ========================================
  // Slide 3: The Solution
  // ========================================
  console.log('Creating slide 3: The Solution');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.WHITE };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('DORA Comply: Your Complete Solution', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('AI-powered automation for DORA compliance', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Intro text
  slide.addText('End-to-end platform that automates vendor assessments, generates regulatory reports, and manages ICT incidents', {
    x: 0.5, y: 1.3, w: 9, h: 0.4,
    fontSize: 12, fontFace: 'Arial', color: COLORS.DARK_GRAY,
    align: 'center'
  });

  // Feature cards
  const features = [
    { icon: 'AI', title: 'AI Document Parsing', desc: 'Upload SOC 2, ISO 27001 reports - AI extracts controls in 60 seconds' },
    { icon: 'RoI', title: 'Register of Information', desc: 'Auto-generates all 15 ESA templates with one-click export' },
    { icon: 'IR', title: 'Incident Reporting', desc: 'Article 19 compliant with 4h/72h/1m deadline tracking' }
  ];

  features.forEach((feature, i) => {
    const x = 0.8 + i * 3.1;
    // Card background
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: 1.9, w: 2.8, h: 2.0,
      fill: { color: COLORS.LIGHT_GRAY },
      line: { color: COLORS.BORDER, width: 0.5 },
      rectRadius: 0.15
    });
    // Icon circle
    slide.addShape(pptx.shapes.OVAL, {
      x: x + 0.95, y: 2.1, w: 0.9, h: 0.9,
      fill: { color: COLORS.PRIMARY }
    });
    slide.addText(feature.icon, {
      x: x + 0.95, y: 2.1, w: 0.9, h: 0.9,
      fontSize: 16, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
      align: 'center', valign: 'middle'
    });
    // Title
    slide.addText(feature.title, {
      x: x + 0.1, y: 3.1, w: 2.6, h: 0.3,
      fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.DARK,
      align: 'center'
    });
    // Description
    slide.addText(feature.desc, {
      x: x + 0.1, y: 3.4, w: 2.6, h: 0.5,
      fontSize: 10, fontFace: 'Arial', color: COLORS.DARK_GRAY,
      align: 'center'
    });
  });

  // Bottom stats
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 4.2, w: 9, h: 0.01,
    fill: { color: COLORS.BORDER }
  });

  const bottomStats = [
    { value: '98%', label: 'Time Reduction' },
    { value: '60s', label: 'Document Parsing' },
    { value: '100%', label: 'ESA Compliance' }
  ];

  bottomStats.forEach((stat, i) => {
    const x = 1.5 + i * 3;
    slide.addText(stat.value, {
      x: x, y: 4.35, w: 2, h: 0.4,
      fontSize: 24, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
      align: 'center'
    });
    slide.addText(stat.label, {
      x: x, y: 4.7, w: 2, h: 0.3,
      fontSize: 10, fontFace: 'Arial', color: COLORS.DARK_GRAY,
      align: 'center'
    });
  });

  // ========================================
  // Slide 4: AI Document Parsing
  // ========================================
  console.log('Creating slide 4: AI Document Parsing');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.WHITE };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('AI-Powered Document Analysis', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Claude AI extracts compliance data in seconds, not hours', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Document types
  slide.addText('Supported Document Types', {
    x: 0.5, y: 1.3, w: 4, h: 0.3,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const docTypes = ['SOC 2 Type I/II', 'ISO 27001', 'ISO 22301', 'PCI DSS', 'Vendor Contracts', 'SLAs'];
  docTypes.forEach((doc, i) => {
    const x = 0.5 + (i % 3) * 1.6;
    const y = 1.7 + Math.floor(i / 3) * 0.4;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 1.5, h: 0.32,
      fill: { color: COLORS.LIGHT_GRAY },
      line: { color: COLORS.BORDER, width: 0.5 },
      rectRadius: 0.05
    });
    slide.addText(doc, {
      x: x, y: y, w: 1.5, h: 0.32,
      fontSize: 9, fontFace: 'Arial', color: COLORS.TEXT,
      align: 'center', valign: 'middle'
    });
  });

  // How it works
  slide.addText('How It Works', {
    x: 0.5, y: 2.7, w: 4, h: 0.3,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const steps = [
    'Upload PDF document (drag and drop)',
    'AI reads and understands document structure',
    'Extracts controls mapped to DORA articles',
    'Populates vendor profile automatically',
    'Flags gaps and risks for review'
  ];

  steps.forEach((step, i) => {
    const y = 3.1 + i * 0.35;
    slide.addShape(pptx.shapes.OVAL, {
      x: 0.5, y: y + 0.02, w: 0.28, h: 0.28,
      fill: { color: COLORS.PRIMARY }
    });
    slide.addText(String(i + 1), {
      x: 0.5, y: y + 0.02, w: 0.28, h: 0.28,
      fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
      align: 'center', valign: 'middle'
    });
    slide.addText(step, {
      x: 0.9, y: y, w: 4, h: 0.32,
      fontSize: 10, fontFace: 'Arial', color: COLORS.TEXT,
      valign: 'middle'
    });
  });

  // Right column - Extracted Info
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.5, y: 1.3, w: 4, h: 2.2,
    fill: { color: COLORS.LIGHT_GRAY },
    line: { color: COLORS.BORDER, width: 0.5 },
    rectRadius: 0.1
  });
  slide.addText('Extracted Information', {
    x: 5.7, y: 1.45, w: 3.6, h: 0.3,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const extractedInfo = [
    'Control objectives and coverage',
    'Audit opinion and exceptions',
    'Certification validity dates',
    'Subservice organizations (4th parties)',
    'Complementary user controls',
    'DORA Article 30 clause mapping'
  ];

  extractedInfo.forEach((info, i) => {
    slide.addText('• ' + info, {
      x: 5.8, y: 1.85 + i * 0.25, w: 3.5, h: 0.25,
      fontSize: 9, fontFace: 'Arial', color: COLORS.TEXT
    });
  });

  // Highlight box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.5, y: 3.7, w: 4, h: 1,
    fill: { color: COLORS.PRIMARY },
    rectRadius: 0.1
  });
  slide.addText('60 sec', {
    x: 5.5, y: 3.85, w: 4, h: 0.5,
    fontSize: 32, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
    align: 'center'
  });
  slide.addText('Average document processing time', {
    x: 5.5, y: 4.35, w: 4, h: 0.3,
    fontSize: 11, fontFace: 'Arial', color: 'FFFFFFCC',
    align: 'center'
  });

  // ========================================
  // Slide 5: Register of Information
  // ========================================
  console.log('Creating slide 5: Register of Information');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.WHITE };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('Register of Information (RoI)', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('All 15 ESA-mandated templates, auto-populated and export-ready', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Intro
  slide.addText('DORA Article 28(3) requires financial entities to maintain a complete Register of Information for all ICT third-party arrangements', {
    x: 0.5, y: 1.2, w: 9, h: 0.35,
    fontSize: 11, fontFace: 'Arial', color: COLORS.TEXT
  });

  // Template grid
  const templates = [
    { code: 'RT.01.01', name: 'Entity maintaining RoI' },
    { code: 'RT.02.01', name: 'Contractual arrangements' },
    { code: 'RT.02.02', name: 'Specific arrangements' },
    { code: 'RT.02.03', name: 'Intragroup arrangements' },
    { code: 'RT.03.01', name: 'ICT service providers' },
    { code: 'RT.03.02', name: 'Entity reliance' },
    { code: 'RT.03.03', name: 'Provider branches' },
    { code: 'RT.04.01', name: '4th party providers' },
    { code: 'RT.05.01', name: 'Functions identification' },
    { code: 'RT.05.02', name: 'ICT services' },
    { code: 'RT.06.01', name: 'Assessment risk' },
    { code: 'RT.07.01', name: 'Entity using services' },
    { code: 'RT.08.01', name: 'Cost information' },
    { code: 'RT.99.01', name: 'Code lists' },
    { code: 'RT.99.02', name: 'Country codes' }
  ];

  templates.forEach((template, i) => {
    const col = i % 5;
    const row = Math.floor(i / 5);
    const x = 0.5 + col * 1.9;
    const y = 1.65 + row * 0.65;

    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: y, w: 1.8, h: 0.55,
      fill: { color: COLORS.LIGHT_GRAY },
      line: { color: COLORS.BORDER, width: 0.5 },
      rectRadius: 0.08
    });
    slide.addText(template.code, {
      x: x, y: y + 0.08, w: 1.8, h: 0.2,
      fontSize: 9, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
      align: 'center'
    });
    slide.addText(template.name, {
      x: x, y: y + 0.28, w: 1.8, h: 0.2,
      fontSize: 8, fontFace: 'Arial', color: COLORS.TEXT,
      align: 'center'
    });
  });

  // Feature boxes at bottom
  const roiFeatures = [
    { title: 'Auto-Population', desc: 'Data flows from vendor profiles to all 15 templates automatically' },
    { title: 'One-Click Export', desc: 'Download ESA-compliant CSV or Excel files for regulator submission' },
    { title: 'Validation Engine', desc: 'Real-time checks against ESA schema before export' }
  ];

  roiFeatures.forEach((feature, i) => {
    const x = 0.5 + i * 3.15;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: 3.85, w: 3, h: 0.85,
      fill: { color: COLORS.DARK },
      rectRadius: 0.1
    });
    slide.addText(feature.title, {
      x: x + 0.15, y: 3.95, w: 2.7, h: 0.25,
      fontSize: 11, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY
    });
    slide.addText(feature.desc, {
      x: x + 0.15, y: 4.2, w: 2.7, h: 0.45,
      fontSize: 9, fontFace: 'Arial', color: 'CBD5E1'
    });
  });

  // ========================================
  // Slide 6: Incident Reporting
  // ========================================
  console.log('Creating slide 6: Incident Reporting');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.WHITE };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('ICT Incident Reporting', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Article 19 compliant with automated deadline tracking', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Timeline
  slide.addText('DORA Reporting Deadlines', {
    x: 0.5, y: 1.3, w: 4, h: 0.3,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const deadlines = [
    { time: '4h', desc: 'Initial notification to competent authority' },
    { time: '72h', desc: 'Intermediate report with root cause analysis' },
    { time: '1m', desc: 'Final report with remediation actions' }
  ];

  deadlines.forEach((deadline, i) => {
    const y = 1.75 + i * 0.65;
    // Time badge
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: y, w: 0.8, h: 0.5,
      fill: { color: 'FEE2E2' },
      line: { color: 'FECACA', width: 0.5 },
      rectRadius: 0.05
    });
    slide.addText(deadline.time, {
      x: 0.5, y: y, w: 0.8, h: 0.5,
      fontSize: 14, fontFace: 'Arial', bold: true, color: 'DC2626',
      align: 'center', valign: 'middle'
    });
    // Description
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 1.4, y: y, w: 4, h: 0.5,
      fill: { color: COLORS.LIGHT_GRAY },
      rectRadius: 0.05
    });
    slide.addText(deadline.desc, {
      x: 1.5, y: y, w: 3.8, h: 0.5,
      fontSize: 11, fontFace: 'Arial', color: COLORS.TEXT,
      valign: 'middle'
    });
  });

  // Classification levels
  slide.addText('Classification Levels', {
    x: 0.5, y: 3.75, w: 4, h: 0.3,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const levels = [
    { label: 'Critical', color: 'FEE2E2', textColor: 'DC2626' },
    { label: 'Major', color: 'FFEDD5', textColor: 'EA580C' },
    { label: 'Minor', color: 'FEF3C7', textColor: 'CA8A04' }
  ];

  levels.forEach((level, i) => {
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.5 + i * 1.9, y: 4.15, w: 1.7, h: 0.5,
      fill: { color: level.color },
      rectRadius: 0.08
    });
    slide.addText(level.label, {
      x: 0.5 + i * 1.9, y: 4.15, w: 1.7, h: 0.5,
      fontSize: 12, fontFace: 'Arial', bold: true, color: level.textColor,
      align: 'center', valign: 'middle'
    });
  });

  // Right column features
  const incidentFeatures = [
    { title: 'Smart Classification', desc: 'AI suggests incident severity based on impact metrics' },
    { title: 'Report Templates', desc: 'Pre-built forms matching ESA requirements' },
    { title: 'Deadline Alerts', desc: 'Automated notifications at critical milestones' }
  ];

  incidentFeatures.forEach((feature, i) => {
    const y = 1.3 + i * 0.85;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 6, y: y, w: 3.5, h: 0.75,
      fill: { color: COLORS.LIGHT_GRAY },
      line: { color: COLORS.BORDER, width: 0.5 },
      rectRadius: 0.1
    });
    slide.addText(feature.title, {
      x: 6.15, y: y + 0.1, w: 3.2, h: 0.25,
      fontSize: 11, fontFace: 'Arial', bold: true, color: COLORS.DARK
    });
    slide.addText(feature.desc, {
      x: 6.15, y: y + 0.38, w: 3.2, h: 0.3,
      fontSize: 9, fontFace: 'Arial', color: COLORS.DARK_GRAY
    });
  });

  // Compliance badge
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6, y: 3.95, w: 3.5, h: 0.8,
    fill: { color: COLORS.SUCCESS },
    rectRadius: 0.1
  });
  slide.addText('Article 19 Compliant', {
    x: 6, y: 4.05, w: 3.5, h: 0.35,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
    align: 'center'
  });
  slide.addText('Full regulatory alignment guaranteed', {
    x: 6, y: 4.4, w: 3.5, h: 0.25,
    fontSize: 10, fontFace: 'Arial', color: 'FFFFFFCC',
    align: 'center'
  });

  // ========================================
  // Slide 7: Third-Party Risk Management
  // ========================================
  console.log('Creating slide 7: Third-Party Risk Management');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.WHITE };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('Third-Party Risk Management', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Complete visibility across your ICT supply chain', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Vendor capabilities
  slide.addText('Vendor Management Capabilities', {
    x: 0.5, y: 1.3, w: 5, h: 0.3,
    fontSize: 14, fontFace: 'Arial', bold: true, color: COLORS.DARK
  });

  const vendorFeatures = [
    'Centralized vendor registry with risk tiering (Critical/Important/Standard)',
    'Automated 4th party detection from SOC 2 subservice organizations',
    'Contract management with exit strategy tracking',
    'Certification expiry monitoring and renewal alerts',
    'Cross-framework control mapping (DORA, SOC 2, ISO, NIST)',
    'Real-time risk scoring with trend analysis'
  ];

  vendorFeatures.forEach((feature, i) => {
    const y = 1.7 + i * 0.45;
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: 0.5, y: y, w: 5.8, h: 0.38,
      fill: { color: COLORS.LIGHT_GRAY },
      rectRadius: 0.05
    });
    slide.addShape(pptx.shapes.OVAL, {
      x: 0.6, y: y + 0.07, w: 0.24, h: 0.24,
      fill: { color: COLORS.SUCCESS }
    });
    slide.addText('+', {
      x: 0.6, y: y + 0.07, w: 0.24, h: 0.24,
      fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
      align: 'center', valign: 'middle'
    });
    slide.addText(feature, {
      x: 0.95, y: y, w: 5.25, h: 0.38,
      fontSize: 10, fontFace: 'Arial', color: COLORS.TEXT,
      valign: 'middle'
    });
  });

  // Risk Analytics box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.6, y: 1.3, w: 3, h: 1.8,
    fill: { color: COLORS.DARK },
    rectRadius: 0.1
  });
  slide.addText('Risk Analytics', {
    x: 6.75, y: 1.45, w: 2.7, h: 0.3,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY
  });

  const riskItems = ['HHI concentration index', 'Geographic risk distribution', 'Single point of failure detection', 'Substitutability assessment'];
  riskItems.forEach((item, i) => {
    slide.addText('• ' + item, {
      x: 6.75, y: 1.8 + i * 0.3, w: 2.7, h: 0.3,
      fontSize: 9, fontFace: 'Arial', color: 'CBD5E1'
    });
  });

  // Concentration Risk box
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 6.6, y: 3.3, w: 3, h: 1.1,
    fill: { color: 'FEF3C7' },
    line: { color: 'FDE68A', width: 1 },
    rectRadius: 0.1
  });
  slide.addText('Concentration Risk', {
    x: 6.75, y: 3.45, w: 2.7, h: 0.3,
    fontSize: 12, fontFace: 'Arial', bold: true, color: '92400E'
  });
  slide.addText('Automated alerts when vendor spend exceeds thresholds defined by your risk appetite', {
    x: 6.75, y: 3.75, w: 2.7, h: 0.55,
    fontSize: 9, fontFace: 'Arial', color: 'A16207'
  });

  // ========================================
  // Slide 8: Competitive Comparison
  // ========================================
  console.log('Creating slide 8: Competitive Comparison');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.LIGHT_GRAY };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('Why DORA Comply?', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Purpose-built for DORA vs. generic GRC platforms', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Table
  const tableData = [
    ['Feature', 'DORA Comply', 'Generic GRC', 'Manual'],
    ['AI Document Parsing', 'Yes - 60s', 'No', 'No'],
    ['15 ESA RoI Templates', 'All 15', 'Partial', 'Manual'],
    ['4th Party Detection', 'Automatic', 'No', 'No'],
    ['DORA Article Mapping', 'Native', 'Generic', 'No'],
    ['Incident Timeline', '4h/72h/1m', 'Basic', 'No'],
    ['Time to Value', 'Days', 'Months', 'Years']
  ];

  slide.addTable(tableData, {
    x: 0.5, y: 1.3, w: 9, h: 3.2,
    colW: [2.5, 2.2, 2.2, 2.1],
    border: { pt: 0.5, color: COLORS.BORDER },
    fill: { color: COLORS.WHITE },
    fontFace: 'Arial',
    fontSize: 10,
    valign: 'middle',
    align: 'center',
    autoPage: false
  });

  // Style header row manually
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0.5, y: 1.3, w: 9, h: 0.45,
    fill: { color: COLORS.DARK }
  });
  slide.addText('Feature', { x: 0.5, y: 1.3, w: 2.5, h: 0.45, fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.WHITE, align: 'center', valign: 'middle' });
  slide.addText('DORA Comply', { x: 3, y: 1.3, w: 2.2, h: 0.45, fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY, align: 'center', valign: 'middle' });
  slide.addText('Generic GRC', { x: 5.2, y: 1.3, w: 2.2, h: 0.45, fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.WHITE, align: 'center', valign: 'middle' });
  slide.addText('Manual', { x: 7.4, y: 1.3, w: 2.1, h: 0.45, fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.WHITE, align: 'center', valign: 'middle' });

  slide.addText('Based on comparison with leading GRC platforms as of Q4 2024', {
    x: 0, y: 4.7, w: '100%', h: 0.3,
    fontSize: 9, fontFace: 'Arial', color: COLORS.DARK_GRAY,
    align: 'center'
  });

  // ========================================
  // Slide 9: Pricing
  // ========================================
  console.log('Creating slide 9: Pricing');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.LIGHT_GRAY };

  // Header
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 1.1,
    fill: { color: COLORS.DARK }
  });
  slide.addText('Simple, Transparent Pricing', {
    x: 0.5, y: 0.25, w: 8, h: 0.5,
    fontSize: 28, fontFace: 'Arial', bold: true, color: COLORS.WHITE
  });
  slide.addText('Scale with your compliance needs', {
    x: 0.5, y: 0.7, w: 8, h: 0.3,
    fontSize: 14, fontFace: 'Arial', color: COLORS.PRIMARY
  });

  // Pricing cards
  const plans = [
    {
      name: 'Starter', price: '$499', period: '/month',
      features: ['Up to 25 vendors', '5 AI document parses/mo', 'Basic RoI export', 'Incident tracking', 'Email support'],
      highlight: false
    },
    {
      name: 'Professional', price: '$1,499', period: '/month',
      features: ['Up to 100 vendors', 'Unlimited AI parsing', 'Full 15-template RoI', '4th party detection', 'Cross-framework mapping', 'Priority support'],
      highlight: true
    },
    {
      name: 'Enterprise', price: 'Custom', period: 'contact us',
      features: ['Unlimited vendors', 'Unlimited AI parsing', 'Custom integrations', 'SSO / SAML', 'Dedicated CSM', 'On-premise option'],
      highlight: false
    }
  ];

  plans.forEach((plan, i) => {
    const x = 0.8 + i * 3.2;

    // Card
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x, y: 1.35, w: 2.9, h: 3.4,
      fill: { color: COLORS.WHITE },
      line: { color: plan.highlight ? COLORS.PRIMARY : COLORS.BORDER, width: plan.highlight ? 2 : 1 },
      rectRadius: 0.15
    });

    // Header
    slide.addShape(pptx.shapes.RECTANGLE, {
      x: x, y: 1.35, w: 2.9, h: 0.9,
      fill: { color: plan.highlight ? COLORS.PRIMARY : COLORS.LIGHT_GRAY }
    });
    slide.addText(plan.name, {
      x: x, y: 1.4, w: 2.9, h: 0.35,
      fontSize: 14, fontFace: 'Arial', bold: true, color: plan.highlight ? COLORS.WHITE : COLORS.DARK,
      align: 'center'
    });
    slide.addText(plan.price, {
      x: x, y: 1.7, w: 2.9, h: 0.35,
      fontSize: 24, fontFace: 'Arial', bold: true, color: plan.highlight ? COLORS.WHITE : COLORS.PRIMARY,
      align: 'center'
    });
    slide.addText(plan.period, {
      x: x, y: 2.0, w: 2.9, h: 0.2,
      fontSize: 10, fontFace: 'Arial', color: plan.highlight ? 'FFFFFFCC' : COLORS.DARK_GRAY,
      align: 'center'
    });

    // Features
    plan.features.forEach((feature, j) => {
      slide.addText('• ' + feature, {
        x: x + 0.2, y: 2.35 + j * 0.28, w: 2.5, h: 0.28,
        fontSize: 9, fontFace: 'Arial', color: COLORS.TEXT
      });
    });

    // Button
    slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
      x: x + 0.2, y: 4.35, w: 2.5, h: 0.35,
      fill: { color: plan.highlight ? COLORS.PRIMARY : COLORS.DARK },
      rectRadius: 0.08
    });
    slide.addText(plan.highlight ? 'Most Popular' : (i === 0 ? 'Start Free Trial' : 'Contact Sales'), {
      x: x + 0.2, y: 4.35, w: 2.5, h: 0.35,
      fontSize: 10, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
      align: 'center', valign: 'middle'
    });
  });

  // ========================================
  // Slide 10: Call to Action
  // ========================================
  console.log('Creating slide 10: Call to Action');
  slide = pptx.addSlide();
  slide.background = { color: COLORS.DARK };

  // Header bar
  slide.addShape(pptx.shapes.RECTANGLE, {
    x: 0, y: 0, w: '100%', h: 0.15,
    fill: { color: COLORS.PRIMARY }
  });

  // Headline
  slide.addText('Ready for DORA Compliance?', {
    x: 0, y: 1.4, w: '100%', h: 0.6,
    fontSize: 32, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
    align: 'center'
  });

  // Subheadline
  slide.addText('Start your 14-day free trial today', {
    x: 0, y: 2.0, w: '100%', h: 0.4,
    fontSize: 16, fontFace: 'Arial', color: COLORS.GRAY,
    align: 'center'
  });

  // Deadline warning
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.5, y: 2.5, w: 5, h: 0.5,
    fill: { color: '331111' },
    line: { color: 'EF4444', width: 1 },
    rectRadius: 0.08
  });
  slide.addText('Only 12 months until DORA enforcement - January 17, 2025', {
    x: 2.5, y: 2.5, w: 5, h: 0.5,
    fontSize: 11, fontFace: 'Arial', color: 'FCA5A5',
    align: 'center', valign: 'middle'
  });

  // CTA buttons
  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 2.8, y: 3.2, w: 2, h: 0.55,
    fill: { color: COLORS.PRIMARY },
    rectRadius: 0.1
  });
  slide.addText('Start Free Trial', {
    x: 2.8, y: 3.2, w: 2, h: 0.55,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.WHITE,
    align: 'center', valign: 'middle'
  });

  slide.addShape(pptx.shapes.ROUNDED_RECTANGLE, {
    x: 5.2, y: 3.2, w: 2, h: 0.55,
    fill: { color: COLORS.DARK },
    line: { color: '475569', width: 2 },
    rectRadius: 0.1
  });
  slide.addText('Schedule Demo', {
    x: 5.2, y: 3.2, w: 2, h: 0.55,
    fontSize: 12, fontFace: 'Arial', bold: true, color: COLORS.GRAY,
    align: 'center', valign: 'middle'
  });

  // Contact info
  slide.addText('Email', {
    x: 2.5, y: 4.0, w: 2.2, h: 0.25,
    fontSize: 10, fontFace: 'Arial', color: COLORS.DARK_GRAY,
    align: 'center'
  });
  slide.addText('sales@doracomply.eu', {
    x: 2.5, y: 4.2, w: 2.2, h: 0.25,
    fontSize: 11, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
    align: 'center'
  });

  slide.addText('Website', {
    x: 5.3, y: 4.0, w: 2.2, h: 0.25,
    fontSize: 10, fontFace: 'Arial', color: COLORS.DARK_GRAY,
    align: 'center'
  });
  slide.addText('www.doracomply.eu', {
    x: 5.3, y: 4.2, w: 2.2, h: 0.25,
    fontSize: 11, fontFace: 'Arial', bold: true, color: COLORS.PRIMARY,
    align: 'center'
  });

  // Footer
  slide.addText('DORA Comply - AI-Powered Compliance for EU Financial Institutions', {
    x: 0, y: 4.8, w: '100%', h: 0.3,
    fontSize: 10, fontFace: 'Arial', color: '475569',
    align: 'center'
  });

  // ========================================
  // Save presentation
  // ========================================
  const outputPath = path.join(__dirname, '..', 'DORA-Comply-Sales-Presentation.pptx');

  console.log('\nSaving presentation...');
  await pptx.writeFile({ fileName: outputPath });

  console.log(`\n✓ Presentation saved to: ${outputPath}`);
  console.log('\n=== Presentation Contents ===');
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
