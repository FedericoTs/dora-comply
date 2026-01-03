# Modal Workers - SOC 2 Document Parser

Optimized SOC 2 document parsing using Modal.com and Gemini 2.5 Flash.

## Architecture

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Vercel     │────►│    Modal     │────►│  Supabase    │
│  (fast API)  │     │  (parsing)   │     │  (database)  │
└──────────────┘     └──────────────┘     └──────────────┘
      │                    │                     │
      │                    │                     │
      ▼                    ▼                     ▼
 Fire-and-forget     24hr timeout        Realtime updates
  (<1 second)        (up to 1 hour)      (progress events)
```

## Features

- **Single-Pass Extraction**: Most documents parsed in 1 API call (~30-60 seconds)
- **65K Output Tokens**: Gemini 2.5 Flash supports 500+ controls per response
- **Structured Output**: Guaranteed valid JSON via Gemini's schema enforcement
- **Real-time Progress**: Updates via Supabase Realtime to extraction_jobs table
- **Context Caching**: Large documents use caching for 40% cost reduction
- **DORA Mapping**: Automatic mapping of SOC 2 controls to DORA articles

## Setup

### 1. Install Modal CLI

```bash
pip install modal
modal setup  # Login to Modal
```

### 2. Create Modal Secrets

```bash
# Create Supabase credentials secret
modal secret create supabase-credentials \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_KEY="your-service-role-key"

# Create Gemini credentials secret
modal secret create gemini-credentials \
  GEMINI_API_KEY="your-gemini-api-key"
```

### 3. Deploy to Modal

```bash
cd modal-workers
modal deploy app.py
```

This will output the endpoint URL, e.g.:
```
https://your-username--dora-comply-soc2-parser-parse-soc2.modal.run
```

### 4. Configure Vercel Environment

Add these environment variables to Vercel:

```bash
MODAL_PARSE_SOC2_URL=https://your-username--dora-comply-soc2-parser-parse-soc2.modal.run
MODAL_AUTH_KEY=your-modal-key  # Optional, for auth
MODAL_AUTH_SECRET=your-modal-secret  # Optional, for auth
USE_MODAL_PARSING=true
```

## Local Development

```bash
# Serve locally (auto-reloads)
modal serve app.py

# Test the health endpoint
curl http://localhost:8000/health

# Test parsing (you'll need a real document in Supabase)
curl -X POST http://localhost:8000/parse-soc2 \
  -H "Content-Type: application/json" \
  -d '{
    "document_id": "uuid-here",
    "job_id": "uuid-here",
    "organization_id": "uuid-here"
  }'
```

## Extraction Strategies

| Strategy | Pages | API Calls | Time | When Used |
|----------|-------|-----------|------|-----------|
| Single-Pass | <80 | 1 | ~30-60s | Default for most SOC 2 reports |
| Two-Pass | 80-150 | 2-3 | ~60-90s | Large reports with caching |
| Parallel | >150 | 3-4 | ~60-120s | Very large enterprise reports |

## Cost Analysis

| Strategy | Modal | Gemini | Total |
|----------|-------|--------|-------|
| Single-Pass | ~$0.001 | ~$0.008 | **~$0.01** |
| Two-Pass | ~$0.002 | ~$0.010 | ~$0.012 |
| Parallel | ~$0.002 | ~$0.015 | ~$0.017 |

Compare to previous implementation: ~$0.03 per document (3x more expensive).

## Database Schema

The parser updates these Supabase tables:

- **extraction_jobs**: Real-time progress tracking (Realtime enabled)
- **parsed_soc2**: Extracted SOC 2 data (controls, exceptions, CUECs)
- **evidence_locations**: Traceability data (page references)
- **vendor_control_assessments**: DORA compliance mappings

## Monitoring

```bash
# View Modal logs
modal logs -f dora-comply-soc2-parser

# View function statistics
modal app list
```

## Files

```
modal-workers/
├── app.py                    # Modal app with FastAPI endpoints
├── parsers/
│   ├── __init__.py
│   ├── soc2_parser_optimized.py  # Main parser with strategies
│   ├── types.py              # Pydantic models
│   ├── schemas.py            # JSON schemas for structured output
│   ├── prompts.py            # Extraction prompts
│   └── dora_mapping.py       # DORA article mapping
├── utils/
│   ├── __init__.py
│   ├── supabase_client.py    # Supabase operations
│   └── gemini_client.py      # Gemini with caching
├── requirements.txt
├── modal.toml
└── README.md
```

## Troubleshooting

### Parse fails immediately
- Check Supabase credentials in Modal secrets
- Verify document exists and storage_path is valid

### Low control extraction
- Document may not be a standard SOC 2 format
- Check Modal logs for extraction details

### Timeout
- Very large documents (200+ pages) may take longer
- Modal has 1-hour timeout, should be sufficient

## Migration from Legacy Parser

1. Set `USE_MODAL_PARSING=false` in Vercel to use legacy parser
2. Deploy Modal workers
3. Test with a sample document
4. Set `USE_MODAL_PARSING=true` to switch to Modal
5. Monitor logs and compare extraction quality
