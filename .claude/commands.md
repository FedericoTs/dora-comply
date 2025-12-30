# Commands & Workflows

## Development Commands

```bash
# Start development server
npm run dev

# Build for production (also runs TypeScript check)
npm run build

# Run ESLint
npm run lint
```

## Supabase Operations (via MCP)

All database operations should use the Supabase MCP tools:

### Schema & Migrations

```
mcp__supabase__list_tables          # View all tables
mcp__supabase__list_migrations      # View applied migrations
mcp__supabase__apply_migration      # Apply new migration
mcp__supabase__get_advisors         # Check for security/performance issues
```

### Type Generation

```
mcp__supabase__generate_typescript_types  # Generate DB types
```

### Security Checks

```
mcp__supabase__get_advisors type="security"     # Security vulnerabilities
mcp__supabase__get_advisors type="performance"  # Performance issues
```

## shadcn/ui Components

```bash
# Add new components
npx shadcn@latest add [component-name]

# Available components to add:
# accordion, alert, alert-dialog, aspect-ratio, avatar, badge,
# breadcrumb, calendar, carousel, chart, checkbox, collapsible,
# command, context-menu, data-table, date-picker, dialog, drawer,
# dropdown-menu, form, hover-card, menubar, navigation-menu,
# pagination, popover, progress, radio-group, resizable,
# scroll-area, separator, sheet, sidebar, skeleton, slider,
# switch, table, tabs, textarea, toggle, toggle-group, tooltip
```

## Git Workflow

```bash
# Check status
git status

# Stage and commit
git add .
git commit -m "feat(module): description

🤖 Generated with Claude Code"

# Push to remote
git push origin main
```

## Vercel Deployment (via MCP)

Deployment is handled automatically via Vercel integration.

## Common Workflows

### Add New Feature Module

1. Create route in `src/app/(dashboard)/[feature]/`
2. Add components in `src/components/[feature]/`
3. Add server actions in `src/lib/actions/[feature].ts`
4. Add validation schemas in `src/lib/validation/[feature].ts`
5. Add types in `src/types/[feature].ts`
6. Run build to verify: `npm run build`

### Add Database Table

1. Create migration via MCP: `mcp__supabase__apply_migration`
2. Include RLS policies in migration
3. Generate types: `mcp__supabase__generate_typescript_types`
4. Update TypeScript types in `src/types/database.ts`

### Add shadcn/ui Component

1. Run: `npx shadcn@latest add [component]`
2. Component appears in `src/components/ui/`
3. Customize styling using design system tokens
4. Use in feature components

### Debug Build Errors

1. Run `npm run build` to see errors
2. TypeScript errors show file:line format
3. Fix errors in order (top to bottom)
4. Re-run build to verify

### Check Security

1. Run `mcp__supabase__get_advisors type="security"`
2. Address any RLS issues
3. Apply migration if needed
4. Verify with advisor check again
