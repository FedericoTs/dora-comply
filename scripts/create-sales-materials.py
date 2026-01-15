#!/usr/bin/env python3
"""
DORA Comply Sales Materials Generator
Creates PDF guide and presentation materials
"""

from reportlab.lib.pagesizes import A4, landscape
from reportlab.lib import colors
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, PageBreak,
    Table, TableStyle, Image, ListFlowable, ListItem
)
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.pdfgen import canvas
from reportlab.graphics.shapes import Drawing, Rect, String
from reportlab.graphics.charts.piecharts import Pie
from reportlab.graphics.charts.barcharts import VerticalBarChart
import os

# Brand Colors
CORAL = colors.HexColor('#E07A5F')
CORAL_LIGHT = colors.HexColor('#F4A593')
DARK_BLUE = colors.HexColor('#1E293B')
SLATE = colors.HexColor('#475569')
SUCCESS = colors.HexColor('#10B981')
WARNING = colors.HexColor('#F59E0B')
WHITE = colors.white

# Output directory
OUTPUT_DIR = os.path.dirname(os.path.abspath(__file__))


def create_styles():
    """Create custom paragraph styles"""
    styles = getSampleStyleSheet()

    styles.add(ParagraphStyle(
        name='CustomTitle',
        parent=styles['Title'],
        fontSize=28,
        textColor=DARK_BLUE,
        spaceAfter=30,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='CustomHeading1',
        parent=styles['Heading1'],
        fontSize=20,
        textColor=CORAL,
        spaceBefore=20,
        spaceAfter=12,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='CustomHeading2',
        parent=styles['Heading2'],
        fontSize=14,
        textColor=DARK_BLUE,
        spaceBefore=15,
        spaceAfter=8,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=SLATE,
        spaceAfter=10,
        alignment=TA_JUSTIFY,
        leading=16
    ))

    styles.add(ParagraphStyle(
        name='Subtitle',
        parent=styles['Normal'],
        fontSize=14,
        textColor=SLATE,
        alignment=TA_CENTER,
        spaceAfter=40
    ))

    styles.add(ParagraphStyle(
        name='Quote',
        parent=styles['Normal'],
        fontSize=12,
        textColor=SLATE,
        leftIndent=20,
        rightIndent=20,
        spaceBefore=10,
        spaceAfter=10,
        fontName='Helvetica-Oblique'
    ))

    styles.add(ParagraphStyle(
        name='Stat',
        parent=styles['Normal'],
        fontSize=36,
        textColor=CORAL,
        alignment=TA_CENTER,
        fontName='Helvetica-Bold'
    ))

    styles.add(ParagraphStyle(
        name='StatLabel',
        parent=styles['Normal'],
        fontSize=11,
        textColor=SLATE,
        alignment=TA_CENTER
    ))

    return styles


def create_pdf_guide():
    """Create the main PDF sales guide"""

    output_path = os.path.join(OUTPUT_DIR, '..', 'DORA_Comply_Sales_Guide.pdf')
    doc = SimpleDocTemplate(
        output_path,
        pagesize=A4,
        rightMargin=1*inch,
        leftMargin=1*inch,
        topMargin=1*inch,
        bottomMargin=1*inch
    )

    styles = create_styles()
    story = []

    # ========================================
    # COVER PAGE
    # ========================================
    story.append(Spacer(1, 2*inch))
    story.append(Paragraph("DORA Comply", styles['CustomTitle']))
    story.append(Paragraph(
        "AI-Powered DORA Compliance Platform<br/>for EU Financial Institutions",
        styles['Subtitle']
    ))
    story.append(Spacer(1, 0.5*inch))

    # Key stat box
    stats_data = [
        ['98%', '60 sec', '15'],
        ['Time Reduction', 'Document Parsing', 'ESA Templates']
    ]
    stats_table = Table(stats_data, colWidths=[2*inch, 2*inch, 2*inch])
    stats_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, 0), CORAL),
        ('TEXTCOLOR', (0, 1), (-1, 1), SLATE),
        ('FONTSIZE', (0, 0), (-1, 0), 32),
        ('FONTSIZE', (0, 1), (-1, 1), 10),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 5),
    ]))
    story.append(stats_table)

    story.append(Spacer(1, 1*inch))
    story.append(Paragraph(
        "<b>Deadline Alert:</b> Register of Information due April 30, 2026",
        ParagraphStyle(
            'Alert',
            parent=styles['CustomBody'],
            textColor=WARNING,
            fontSize=12,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
    ))

    story.append(PageBreak())

    # ========================================
    # EXECUTIVE SUMMARY
    # ========================================
    story.append(Paragraph("Executive Summary", styles['CustomHeading1']))

    story.append(Paragraph(
        """DORA Comply is the only unified Third-Party Risk Management (TPRM) and
        Register of Information (RoI) platform purpose-built for DORA compliance.
        Our AI-powered document parsing eliminates manual questionnaire cycles,
        reducing vendor assessment time from weeks to minutes.""",
        styles['CustomBody']
    ))

    story.append(Paragraph("The DORA Challenge", styles['CustomHeading2']))
    story.append(Paragraph(
        """The Digital Operational Resilience Act (DORA) requires all EU financial
        entities to submit their Register of Information by April 30, 2026. This
        includes detailed data on 15 ESA-mandated templates covering vendors,
        contracts, ICT services, and the entire subcontracting chain.""",
        styles['CustomBody']
    ))

    # Problem/Solution table
    problem_solution = [
        ['Challenge', 'DORA Comply Solution'],
        ['300+ hours to create RoI manually', 'Automated RoI generation in 4 hours'],
        ['60+ day vendor assessment cycles', 'AI parsing in under 60 seconds'],
        ['No visibility into 4th parties', 'Automatic subcontractor detection'],
        ['Multiple disconnected tools', 'Unified TPRM + RoI platform'],
        ['EU data residency requirements', 'Frankfurt/Dublin hosting'],
    ]

    problem_table = Table(problem_solution, colWidths=[2.5*inch, 3*inch])
    problem_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), CORAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 1), (-1, -1), SLATE),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(Spacer(1, 0.3*inch))
    story.append(problem_table)

    story.append(PageBreak())

    # ========================================
    # KEY FEATURES
    # ========================================
    story.append(Paragraph("Platform Capabilities", styles['CustomHeading1']))

    features = [
        ("AI Document Parsing",
         "Extract compliance data from SOC 2, ISO 27001, and penetration test reports in under 60 seconds with 95%+ accuracy."),
        ("Register of Information",
         "All 15 ESA-mandated templates (B_01 through B_07) auto-populated and export-ready in xBRL-CSV format."),
        ("ICT Incident Reporting",
         "DORA Article 19 compliant workflow with automated 4-hour, 72-hour, and 30-day deadline tracking."),
        ("Vendor Lifecycle Management",
         "Complete TPRM from onboarding to exit, with automatic criticality scoring and risk assessment."),
        ("4th Party Intelligence",
         "Automatic detection and mapping of subcontractors from SOC 2 subservice organization sections."),
        ("Concentration Risk Analytics",
         "Real-time monitoring of provider, geographic, and service concentration with board-ready dashboards."),
        ("Cross-Framework Mapping",
         "Unified compliance view across DORA, SOC 2, ISO 27001, NIST CSF, GDPR, and NIS2."),
        ("Continuous Monitoring",
         "Certification expiry alerts, security rating integration, and vendor news monitoring."),
    ]

    for title, description in features:
        story.append(Paragraph(f"<b>{title}</b>", styles['CustomHeading2']))
        story.append(Paragraph(description, styles['CustomBody']))

    story.append(PageBreak())

    # ========================================
    # ROI TEMPLATES
    # ========================================
    story.append(Paragraph("Register of Information Templates", styles['CustomHeading1']))

    story.append(Paragraph(
        """DORA Comply supports all 15 ESA-mandated templates, ensuring complete
        regulatory compliance for your RoI submission.""",
        styles['CustomBody']
    ))

    templates = [
        ['Template', 'Description', 'Status'],
        ['B_01.01', 'Entity maintaining the register', 'Supported'],
        ['B_01.02', 'Entities making use of ICT services', 'Supported'],
        ['B_01.03', 'Branches of financial entities', 'Supported'],
        ['B_02.01', 'List of ICT third-party providers', 'Supported'],
        ['B_02.02', 'ICT services provided (provider view)', 'Supported'],
        ['B_02.03', 'Providers identified by other identifiers', 'Supported'],
        ['B_03.01', 'Contractual arrangements - general', 'Supported'],
        ['B_03.02', 'Contractual arrangements - specific', 'Supported'],
        ['B_04.01', 'ICT services (entity view)', 'Supported'],
        ['B_04.02', 'Data and ICT assets locations', 'Supported'],
        ['B_05.01', 'Functions identification', 'Supported'],
        ['B_05.02', 'Functions - ICT services mapping', 'Supported'],
        ['B_06.01', 'ICT subcontracting chain', 'Supported'],
        ['B_07.01', 'ICT intra-group arrangements', 'Supported'],
    ]

    template_table = Table(templates, colWidths=[1*inch, 3.5*inch, 1*inch])
    template_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('TEXTCOLOR', (0, 1), (1, -1), SLATE),
        ('TEXTCOLOR', (2, 1), (2, -1), SUCCESS),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('ALIGN', (2, 0), (2, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
        ('ROWBACKGROUNDS', (0, 1), (-1, -1), [WHITE, colors.HexColor('#F8FAFC')]),
    ]))
    story.append(template_table)

    story.append(PageBreak())

    # ========================================
    # COMPETITIVE COMPARISON
    # ========================================
    story.append(Paragraph("Competitive Comparison", styles['CustomHeading1']))

    comparison = [
        ['Feature', 'DORA Comply', 'OneTrust', 'Vanta', 'Manual'],
        ['DORA-Native', 'Yes', 'Bolt-on', 'Partial', 'N/A'],
        ['AI Document Parsing', 'LLM-Powered', 'Basic', 'Limited', 'None'],
        ['Unified TPRM + RoI', 'Yes', 'Separate', 'No', 'Spreadsheets'],
        ['4th Party Detection', 'Automatic', 'Manual', 'No', 'Manual'],
        ['EU Data Residency', 'Yes', 'No', 'No', 'Depends'],
        ['Deployment Time', '10 Days', 'Months', 'Weeks', 'N/A'],
        ['Starting Price', '499/mo', '$150K+/yr', '$15K+/yr', 'Staff time'],
    ]

    comp_table = Table(comparison, colWidths=[1.5*inch, 1.1*inch, 1.1*inch, 1.1*inch, 1.1*inch])
    comp_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('BACKGROUND', (1, 0), (1, 0), CORAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 9),
        ('BACKGROUND', (1, 1), (1, -1), colors.HexColor('#FEF3F0')),
        ('TEXTCOLOR', (0, 1), (-1, -1), SLATE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 1), (0, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(comp_table)

    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("Why Choose DORA Comply?", styles['CustomHeading2']))

    benefits = [
        "Purpose-built for DORA from day one - not a retrofitted compliance tool",
        "AI eliminates questionnaire fatigue - extract data from existing audits",
        "Single platform for TPRM and RoI - no integration headaches",
        "EU data residency in Frankfurt - meet regulatory requirements",
        "10-day deployment - be compliant before the deadline",
    ]

    for benefit in benefits:
        story.append(Paragraph(f"<bullet>&bull;</bullet> {benefit}", styles['CustomBody']))

    story.append(PageBreak())

    # ========================================
    # PRICING
    # ========================================
    story.append(Paragraph("Pricing Plans", styles['CustomHeading1']))

    pricing = [
        ['Plan', 'Starter', 'Professional', 'Enterprise'],
        ['Price', '499/month', '999/month', 'Custom'],
        ['Vendors', 'Up to 50', 'Up to 250', 'Unlimited'],
        ['Team Members', '5', '20', 'Unlimited'],
        ['Document Parsing', '100/month', '500/month', 'Unlimited'],
        ['RoI Templates', 'All 15', 'All 15', 'All 15'],
        ['Support', 'Email', 'Priority', 'Dedicated CSM'],
        ['Data Residency', 'EU', 'EU', 'Custom'],
    ]

    pricing_table = Table(pricing, colWidths=[1.5*inch, 1.5*inch, 1.5*inch, 1.5*inch])
    pricing_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), DARK_BLUE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('FONTSIZE', (0, 1), (-1, 1), 14),
        ('TEXTCOLOR', (0, 1), (-1, 1), CORAL),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('TEXTCOLOR', (0, 2), (-1, -1), SLATE),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('ALIGN', (0, 2), (0, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(pricing_table)

    story.append(Spacer(1, 0.5*inch))
    story.append(Paragraph(
        "<b>14-Day Free Trial</b> - No credit card required",
        ParagraphStyle(
            'CTA',
            parent=styles['CustomBody'],
            textColor=SUCCESS,
            fontSize=14,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
    ))

    story.append(PageBreak())

    # ========================================
    # SECURITY & COMPLIANCE
    # ========================================
    story.append(Paragraph("Security & Compliance", styles['CustomHeading1']))

    story.append(Paragraph(
        """DORA Comply is built with enterprise-grade security from the ground up.
        We understand that compliance platforms must themselves be compliant.""",
        styles['CustomBody']
    ))

    security_features = [
        ("Data Encryption", "AES-256 at rest, TLS 1.3 in transit"),
        ("Authentication", "MFA mandatory for admins, SSO support"),
        ("Data Residency", "EU-only hosting (Frankfurt primary, Dublin backup)"),
        ("Access Control", "Role-based permissions, row-level security"),
        ("Audit Trail", "Complete activity logging and versioning"),
        ("Certifications", "SOC 2 Type II (in progress), ISO 27001 (planned)"),
    ]

    for title, description in security_features:
        story.append(Paragraph(f"<b>{title}:</b> {description}", styles['CustomBody']))

    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph("Technical Specifications", styles['CustomHeading2']))

    tech_specs = [
        ['Specification', 'Details'],
        ['Platform', 'Cloud-native SaaS (Vercel Edge + Serverless)'],
        ['Database', 'PostgreSQL 15 (Multi-region)'],
        ['AI Engine', 'Claude 3.5 Sonnet + GPT-4 Vision'],
        ['API', 'RESTful, < 500ms p95 response time'],
        ['Uptime SLA', '99.9% availability'],
        ['Scalability', '100,000+ vendors per tenant'],
    ]

    tech_table = Table(tech_specs, colWidths=[2*inch, 4*inch])
    tech_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), SLATE),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, -1), 10),
        ('BACKGROUND', (0, 1), (-1, -1), WHITE),
        ('TEXTCOLOR', (0, 1), (-1, -1), SLATE),
        ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
        ('PADDING', (0, 0), (-1, -1), 8),
        ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor('#E2E8F0')),
    ]))
    story.append(tech_table)

    story.append(PageBreak())

    # ========================================
    # CALL TO ACTION
    # ========================================
    story.append(Spacer(1, 1*inch))
    story.append(Paragraph("Get Started Today", styles['CustomTitle']))
    story.append(Spacer(1, 0.5*inch))

    story.append(Paragraph(
        """Your Register of Information is due April 30, 2026.<br/>
        Don't wait until it's too late.""",
        ParagraphStyle(
            'CTABody',
            parent=styles['Subtitle'],
            fontSize=16,
            textColor=SLATE
        )
    ))

    story.append(Spacer(1, 0.5*inch))

    cta_steps = [
        ["1", "2", "3"],
        ["Schedule Demo", "Start Free Trial", "Be Compliant"],
        ["30-minute walkthrough", "14 days, no card required", "Before the deadline"],
    ]

    cta_table = Table(cta_steps, colWidths=[2*inch, 2*inch, 2*inch])
    cta_table.setStyle(TableStyle([
        ('TEXTCOLOR', (0, 0), (-1, 0), CORAL),
        ('FONTSIZE', (0, 0), (-1, 0), 36),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 1), (-1, 1), DARK_BLUE),
        ('FONTSIZE', (0, 1), (-1, 1), 14),
        ('FONTNAME', (0, 1), (-1, 1), 'Helvetica-Bold'),
        ('TEXTCOLOR', (0, 2), (-1, 2), SLATE),
        ('FONTSIZE', (0, 2), (-1, 2), 10),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
        ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
    ]))
    story.append(cta_table)

    story.append(Spacer(1, 1*inch))

    contact_info = [
        ['Contact Us'],
        ['Website: doracomply.eu'],
        ['Email: sales@doracomply.eu'],
        ['Demo: calendly.com/doracomply/demo'],
    ]

    contact_table = Table(contact_info, colWidths=[4*inch])
    contact_table.setStyle(TableStyle([
        ('BACKGROUND', (0, 0), (-1, 0), CORAL),
        ('TEXTCOLOR', (0, 0), (-1, 0), WHITE),
        ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
        ('FONTSIZE', (0, 0), (-1, 0), 14),
        ('BACKGROUND', (0, 1), (-1, -1), colors.HexColor('#F8FAFC')),
        ('TEXTCOLOR', (0, 1), (-1, -1), SLATE),
        ('FONTSIZE', (0, 1), (-1, -1), 11),
        ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
        ('PADDING', (0, 0), (-1, -1), 12),
    ]))
    story.append(contact_table)

    # Build PDF
    doc.build(story)
    print(f"PDF Guide created: {output_path}")
    return output_path


if __name__ == "__main__":
    print("Creating DORA Comply Sales Materials...")
    print("-" * 50)

    pdf_path = create_pdf_guide()
    print(f"\nDone! Files created:")
    print(f"  - {pdf_path}")
