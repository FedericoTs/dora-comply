# Skills Reference

## When to Use Skills

Skills extend Claude's capabilities for specialized tasks. Use the appropriate skill when the task matches its domain.

---

## Project Management

### `/project-orchestrator`

**Use when:** Planning, coordinating, or managing project work.

Triggers:
- Sprint planning
- Task breakdown
- Dependency mapping
- Implementation sequencing
- Progress tracking
- Resource coordination

### `/compliance-orchestrator`

**Use when:** Managing compliance workflows and requirements.

Triggers:
- Regulatory requirement tracking
- Compliance gap analysis
- Audit preparation
- Evidence collection coordination
- Control implementation planning

---

## Compliance & Risk

### `/dora-compliance`

**Use when:** DORA-specific compliance tasks.

Triggers:
- DORA regulation interpretation
- RoI (Register of Information) templates
- Incident reporting requirements (Art. 19)
- ICT risk management
- ESA submission formats (xBRL-CSV)
- Critical function assessment

### `/soc2-reports`

**Use when:** SOC 2 report analysis and processing.

Triggers:
- SOC 2 Type I/II report parsing
- Control testing results extraction
- Exception identification
- Subservice organization detection
- CUEC (Complementary User Entity Controls) analysis
- Audit opinion interpretation

### `/tprm-domain`

**Use when:** Third-party risk management tasks.

Triggers:
- Vendor assessment workflows
- Risk scoring methodology
- Due diligence processes
- Contract analysis (Art. 30 provisions)
- Vendor lifecycle management
- 4th party detection

---

## Security

### `/cybersecurity-expert`

**Use when:** Security auditing or implementing security features.

Triggers:
- Security vulnerability assessment
- Secret/credential scanning
- API key storage review
- Authentication security
- OWASP compliance checks
- RLS (Row-Level Security) review
- Input validation hardening

---

## Frontend & Design

### `/example-skills:frontend-design`

**Use when:** Creating or updating UI components, pages, or layouts.

Triggers:
- Building new components (forms, cards, modals, tables)
- Implementing page layouts
- Creating responsive designs
- Applying design system tokens
- Premium styling implementation

### `/product-design`

**Use when:** Making product design decisions.

Triggers:
- User flow decisions
- Feature prioritization
- UI/UX trade-offs
- Design system updates
- Information architecture

### `/user-experience`

**Use when:** Evaluating or improving user experience.

Triggers:
- Usability reviews
- Accessibility improvements
- User journey mapping
- Interaction design
- Form UX optimization

---

## Optimization

### `/nextjs-code-optimizer`

**Use when:** Optimizing Next.js application performance.

Triggers:
- Bundle size analysis
- Server Component optimization
- Route optimization
- Build performance
- Caching strategies

### `/ultraoptimization-expert`

**Use when:** Optimizing API calls and reducing costs.

Triggers:
- API cost reduction
- External API caching
- Rate limiting implementation
- AI API optimization (Claude, GPT)
- Batch processing strategies

---

## Document Generation

### `/example-skills:pdf`

**Use when:** Creating or manipulating PDFs.

Triggers:
- RoI export to PDF
- Incident report generation
- Compliance certificate generation
- Form filling automation
- Document merging

### `/example-skills:xlsx`

**Use when:** Working with spreadsheets.

Triggers:
- RoI template generation (xBRL-CSV)
- Vendor data export
- Risk assessment matrices
- Compliance reporting
- Data analysis

### `/example-skills:docx`

**Use when:** Working with Word documents.

Triggers:
- Policy document generation
- Compliance report templates
- Contract templates
- Audit documentation

---

## Development Tools

### `/example-skills:mcp-builder`

**Use when:** Building or extending MCP servers.

Triggers:
- Custom tool creation
- External API integration
- Workflow automation

### `/example-skills:webapp-testing`

**Use when:** Testing web application functionality.

Triggers:
- Playwright testing
- UI verification
- Screenshot capture
- Form submission testing
- Auth flow testing

---

## Skill Combinations by Feature

| Feature | Primary Skills |
|---------|----------------|
| **Auth System** | frontend-design, cybersecurity-expert |
| **Vendor Management** | tprm-domain, frontend-design, user-experience |
| **Document Parsing** | soc2-reports, ultraoptimization-expert |
| **RoI Generation** | dora-compliance, xlsx, pdf |
| **Incident Reporting** | dora-compliance, frontend-design |
| **Gap Analysis** | tprm-domain, soc2-reports, dora-compliance |
| **Dashboard** | frontend-design, product-design |
| **Contract Analysis** | tprm-domain, dora-compliance |
| **Export Features** | xlsx, pdf, dora-compliance |

---

## Usage Examples

```
User: "Implement the vendor assessment form"
Claude: Uses /tprm-domain + /example-skills:frontend-design

User: "Review RLS policies for security"
Claude: Uses /cybersecurity-expert

User: "Create the RoI export functionality"
Claude: Uses /dora-compliance + /example-skills:xlsx

User: "Plan the incident reporting module"
Claude: Uses /project-orchestrator + /dora-compliance

User: "Parse SOC 2 reports with AI"
Claude: Uses /soc2-reports + /ultraoptimization-expert

User: "Design the compliance dashboard"
Claude: Uses /product-design + /example-skills:frontend-design
```
