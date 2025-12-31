# Test Documents for DORA Compliance Testing

This folder contains sample PDF documents for testing the AI contract analysis and quick scan features.

## Available Documents

### SaaS/Service Agreements
| File | Description | Expected Type | ICT Contract |
|------|-------------|---------------|--------------|
| `microsoft-cloud-agreement.pdf` | Microsoft Cloud Agreement (EMEA) | Master Agreement | Yes |
| `prefect-saas-agreement.pdf` | Prefect SaaS Agreement | Service Agreement | Yes |
| `superlegal-saas-template.pdf` | Generic SaaS Services Agreement Template | Service Agreement | Yes |
| `sfgov-saas-template.pdf` | SF Government SaaS and Hosted Services Template | Master Agreement | Yes |

### SLA (Service Level Agreements)
| File | Description | Expected Type | ICT Contract |
|------|-------------|---------------|--------------|
| `aruba-cloud-sla.pdf` | Aruba Cloud Service Level Agreement | SLA | Yes |

### DPA (Data Processing Agreements)
| File | Description | Expected Type | ICT Contract |
|------|-------------|---------------|--------------|
| `gigamon-dpa.pdf` | Gigamon Data Processing Agreement | DPA | Yes |
| `contentsquare-dpa.pdf` | ContentSquare Customer DPA (GDPR/CCPA) | DPA | Yes |

### Marketplace/Reseller Contracts
| File | Description | Expected Type | ICT Contract |
|------|-------------|---------------|--------------|
| `aws-marketplace-contract.pdf` | AWS Marketplace Standard Contract | Service Agreement | Yes |

## Testing Workflow

### 1. Quick Scan Test (Contract Form)
1. Go to a vendor page
2. Click "Add Contract"
3. Upload a PDF from this folder
4. Verify the AI quick scan correctly identifies:
   - Document type (contract, SLA, DPA, etc.)
   - ICT contract indicator
   - Critical function likelihood
   - Key dates (effective, expiry)
   - Services mentioned

### 2. Full DORA Analysis Test (Documents Page)
1. Upload a document to a vendor
2. Go to the document detail page
3. Click "Analyze with AI"
4. Verify the analysis includes:
   - Article 30.2 provisions (8 items)
   - Article 30.3 provisions (8 items for critical functions)
   - Exact page/section citations for each finding
   - Verbatim excerpts from the document
   - Compliance score

### 3. Sign-Off Workflow Test
1. After analysis completes, click "Sign Off on Results"
2. Review the extracted provisions
3. Confirm the legal acknowledgment
4. Apply results to the contract

## Expected DORA Provisions to Find

### Article 30.2 (All ICT Contracts)
- Service description
- Data locations
- Data protection
- Availability guarantees
- Incident support
- Authority cooperation
- Termination rights
- Subcontracting conditions

### Article 30.3 (Critical Functions)
- SLA targets
- Notice periods
- Business continuity
- ICT security
- TLPT participation
- Audit rights
- Exit strategy
- Performance access

## Sources

These documents were collected from:
- [Microsoft Licensing](https://www.microsoft.com/licensing/)
- [Aruba Cloud](https://www.arubacloud.com/)
- [Gigamon](https://www.gigamon.com/)
- [ContentSquare](https://contentsquare.com/)
- [Prefect](https://www.prefect.io/)
- [Superlegal.ai](https://www.superlegal.ai/)
- [SF Gov](https://www.sfgov.org/)
- [AWS Marketplace](https://aws.amazon.com/marketplace/)
