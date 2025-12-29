# Development Setup Guide

Complete guide to setting up the DORA Compliance Platform for local development.

---

## Prerequisites

- **Node.js** 18.17+ (LTS recommended)
- **npm** 9+ or **pnpm** 8+
- **Git**
- **Supabase Account** (free tier works)
- **Anthropic API Key** (for AI parsing)

---

## Quick Start

```bash
# 1. Clone the repository
git clone <repository-url>
cd compliance-app

# 2. Install dependencies
npm install

# 3. Copy environment template
cp .env.example .env.local

# 4. Configure environment variables (see below)

# 5. Run development server
npm run dev

# 6. Open http://localhost:3000
```

---

## Environment Variables

### Required Variables

Create `.env.local` with the following:

```env
# ============================================
# SUPABASE - EU REGION (Primary for EU customers)
# ============================================
NEXT_PUBLIC_SUPABASE_URL_EU=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_EU=your-anon-key
SUPABASE_SERVICE_ROLE_KEY_EU=your-service-role-key

# ============================================
# SUPABASE - US REGION (For US customers)
# ============================================
NEXT_PUBLIC_SUPABASE_URL_US=https://your-us-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY_US=your-us-anon-key
SUPABASE_SERVICE_ROLE_KEY_US=your-us-service-role-key

# ============================================
# DEFAULT REGION
# ============================================
NEXT_PUBLIC_DEFAULT_REGION=eu

# ============================================
# AI PROVIDERS
# ============================================
ANTHROPIC_API_KEY=sk-ant-...
OPENAI_API_KEY=sk-...  # Optional, for fallback

# ============================================
# APPLICATION
# ============================================
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME="DORA Compliance Platform"

# ============================================
# OPTIONAL SERVICES
# ============================================
# SENDGRID_API_KEY=SG...
# GLEIF_API_KEY=...
```

### Getting Supabase Credentials

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Select **Frankfurt (eu-central-1)** for EU region
3. Go to **Settings > API**
4. Copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL_EU`
   - anon public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY_EU`
   - service_role key → `SUPABASE_SERVICE_ROLE_KEY_EU`

For US region, create a second project in **N. Virginia (us-east-1)**.

### Getting Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Copy to `ANTHROPIC_API_KEY`

---

## Database Setup

### Option 1: Supabase Dashboard (Recommended for first time)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Copy contents of `supabase/migrations/001_initial_schema.sql`
4. Paste and run in SQL Editor
5. Repeat for US region project if needed

### Option 2: Supabase CLI

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link to your project
supabase link --project-ref your-project-ref

# Run migrations
supabase db push
```

---

## Storage Setup

Create a storage bucket for documents:

1. Go to Supabase Dashboard > Storage
2. Create new bucket named `documents`
3. Set to **Private** (not public)
4. Add policy:

```sql
-- Allow authenticated users to upload to their org folder
CREATE POLICY "Users can upload to org folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (
    SELECT organization_id::text FROM users WHERE id = auth.uid()
  )
);

-- Allow users to read their org's files
CREATE POLICY "Users can read org files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'documents' AND
  auth.role() = 'authenticated' AND
  (storage.foldername(name))[1] = (
    SELECT organization_id::text FROM users WHERE id = auth.uid()
  )
);
```

---

## Running the Application

### Development

```bash
# Start dev server with hot reload
npm run dev

# Open in browser
open http://localhost:3000
```

### Build & Production

```bash
# Create production build
npm run build

# Start production server
npm start
```

### Linting & Formatting

```bash
# Run ESLint
npm run lint

# Fix auto-fixable issues
npm run lint:fix

# Type check
npm run typecheck
```

---

## Project Structure

```
compliance-app/
├── docs/                      # Documentation
│   ├── design/               # Design system, wireframes
│   ├── planning/             # PRD, roadmap, decisions
│   ├── sprints/              # Sprint plans
│   ├── architecture/         # Tech specs
│   └── requirements/         # Regulatory requirements
├── public/                    # Static assets
├── src/
│   ├── app/                  # Next.js App Router
│   │   ├── (auth)/          # Auth routes (login, register)
│   │   ├── (dashboard)/     # Protected routes
│   │   └── api/             # API routes
│   ├── components/
│   │   ├── ui/              # shadcn/ui components
│   │   └── [feature]/       # Feature components
│   ├── lib/
│   │   ├── supabase/        # Supabase clients
│   │   ├── ai/              # AI parsing logic
│   │   └── utils/           # Utilities
│   ├── hooks/                # React hooks
│   └── types/                # TypeScript types
├── supabase/
│   └── migrations/           # Database migrations
└── .env.local                # Environment variables (not committed)
```

---

## VS Code Setup (Recommended)

### Extensions

Install these extensions for best experience:

- **ESLint** - dbaeumer.vscode-eslint
- **Prettier** - esbenp.prettier-vscode
- **Tailwind CSS IntelliSense** - bradlc.vscode-tailwindcss
- **TypeScript** - (built-in)
- **PostCSS Language Support** - csstools.postcss

### Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": "explicit"
  },
  "typescript.preferences.importModuleSpecifier": "relative",
  "tailwindCSS.experimental.classRegex": [
    ["cva\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"],
    ["cn\\(([^)]*)\\)", "[\"'`]([^\"'`]*).*?[\"'`]"]
  ]
}
```

---

## Common Issues

### Issue: "Module not found" errors

```bash
# Clear cache and reinstall
rm -rf node_modules .next
npm install
```

### Issue: Supabase connection fails

- Check that environment variables are set correctly
- Ensure Supabase project is not paused (free tier pauses after 7 days)
- Check browser console for CORS errors

### Issue: Auth not working

- Ensure you've run the database migrations
- Check that RLS policies are in place
- Verify the anon key is correct

### Issue: Types out of sync with database

```bash
# Regenerate types from Supabase
npx supabase gen types typescript --project-id your-project-id > src/types/database.ts
```

---

## Useful Commands

```bash
# Development
npm run dev              # Start dev server
npm run build            # Production build
npm run start            # Start production server
npm run lint             # Check for lint errors
npm run typecheck        # TypeScript check

# Database
npm run db:generate      # Generate types from Supabase
npm run db:migrate       # Run migrations (if using CLI)

# Testing (when added)
npm run test             # Run tests
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report
```

---

## Next Steps

After setup is complete:

1. Create a test account at `/register`
2. Add a test vendor at `/vendors/new`
3. Upload a sample document
4. Explore the dashboard

See [Sprint 1](./sprints/sprint-01.md) for first development tasks.

---

## Getting Help

- Check existing documentation in `/docs`
- Review code comments
- Ask in team Slack channel

---

**Last Updated:** 2024-12-28
