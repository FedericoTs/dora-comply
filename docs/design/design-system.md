# Design System

**Document Status:** [CURRENT]
**Last Updated:** 2024-12-28
**Framework:** shadcn/ui + Tailwind CSS v4
**Design Philosophy:** Premium, Airbnb-inspired minimalism

---

## Brand Identity

### Product Name
**DORA Comply**

### Tagline Options
- "From document to compliant in 60 seconds"
- "Your vendors already did the audit. We just read it."
- "AI-powered DORA compliance"

### Brand Personality
- **Premium**: World-class design like Airbnb, Stripe, Linear
- **Clean**: Generous whitespace, refined typography
- **Professional**: Enterprise-grade, trusted by financial institutions
- **Modern**: Startup-first, cutting-edge UX

### Design Principles
1. **Restraint over excess** - No glassmorphism, no gradient meshes, no visual gimmicks
2. **Typography is king** - Beautiful fonts, clear hierarchy
3. **Whitespace is a feature** - Generous padding, breathing room
4. **Subtle sophistication** - Multi-layer shadows, refined borders
5. **One accent color** - Warm terracotta used sparingly

---

## Color Palette

### Primary Colors

```css
/* Primary - Warm Terracotta (Airbnb-inspired) */
--primary: #E07A5F;
--primary-foreground: #FFFFFF;

/* Light mode accent */
--accent: #FEF3F0;  /* Soft peachy tint */
```

### Neutral Colors

```css
/* Background & Foreground */
--background: #FFFFFF;
--foreground: #0F172A;

/* Card */
--card: #FFFFFF;
--card-foreground: #0F172A;

/* Secondary */
--secondary: #F8FAFC;
--secondary-foreground: #0F172A;

/* Muted */
--muted: #F1F5F9;
--muted-foreground: #64748B;

/* Border */
--border: #E2E8F0;
--input: #E2E8F0;
```

### Semantic Colors

```css
/* Success - Emerald */
--success: #10B981;

/* Warning - Amber */
--warning: #F59E0B;

/* Error - Red */
--error: #EF4444;

/* Info - Blue */
--info: #3B82F6;
```

### Chart Colors

```css
--chart-1: #E07A5F; /* Terracotta */
--chart-2: #3D9970; /* Forest */
--chart-3: #0EA5E9; /* Ocean */
--chart-4: #8B5CF6; /* Violet */
--chart-5: #F59E0B; /* Amber */
```

### Risk Score Colors

```css
--risk-low: #10B981;      /* Green */
--risk-medium: #F59E0B;   /* Amber */
--risk-high: #F97316;     /* Orange */
--risk-critical: #EF4444; /* Red */
```

---

## Typography

### Font Family

```css
/* Primary Font - Plus Jakarta Sans */
--font-sans: 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif;

/* Monospace */
--font-mono: 'SF Mono', ui-monospace, monospace;
```

### Font Hierarchy

| Element | Size | Weight | Letter Spacing | Line Height |
|---------|------|--------|----------------|-------------|
| h1 | 36px (text-4xl) | 600 (semibold) | -0.03em | 1.1 |
| h2 | 24px (text-2xl) | 600 (semibold) | -0.025em | 1.2 |
| h3 | 20px (text-xl) | 600 (semibold) | -0.02em | 1.3 |
| h4 | 18px (text-lg) | 500 (medium) | -0.015em | 1.4 |
| body | 16px (text-base) | 400 (normal) | -0.011em | 1.6 |
| small | 14px (text-sm) | 400 (normal) | normal | 1.5 |
| caption | 12px (text-xs) | 500 (medium) | normal | 1.4 |

---

## Spacing & Radius

### Border Radius

```css
--radius: 0.75rem;  /* 12px base */
--radius-sm: 8px;
--radius-md: 10px;
--radius-lg: 12px;
--radius-xl: 16px;
--radius-2xl: 20px;
```

### Common Spacing Patterns

| Use Case | Value |
|----------|-------|
| Card padding | p-6 (24px) |
| Section gap | gap-6 (24px) |
| Element gap | gap-3 or gap-4 |
| Page padding | p-8 (32px) |
| Sidebar width | w-64 (256px) |
| Header height | h-16 (64px) |

---

## Shadow System

### Premium Card Shadow

```css
.card-premium {
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 2px 4px rgba(0, 0, 0, 0.02),
    0 12px 24px rgba(0, 0, 0, 0.03);
}

.card-premium:hover {
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.03),
    0 4px 8px rgba(0, 0, 0, 0.04),
    0 24px 48px rgba(0, 0, 0, 0.06);
}
```

### Stat Card Shadow

```css
.stat-card {
  box-shadow:
    0 0 0 1px rgba(0, 0, 0, 0.02),
    0 1px 2px rgba(0, 0, 0, 0.02);
}
```

---

## Component Styles

### Buttons

```css
/* Primary Button */
.btn-primary {
  @apply inline-flex items-center justify-center gap-2 px-5 py-2.5;
  @apply bg-primary text-primary-foreground font-medium rounded-lg;
  @apply transition-all duration-200;
}

.btn-primary:hover {
  @apply opacity-90;
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(224, 122, 95, 0.25);
}

/* Secondary Button */
.btn-secondary {
  @apply inline-flex items-center justify-center gap-2 px-5 py-2.5;
  @apply bg-secondary text-secondary-foreground font-medium rounded-lg;
  @apply border border-border transition-all duration-200;
}

/* Ghost Button */
.btn-ghost {
  @apply inline-flex items-center justify-center gap-2 px-4 py-2;
  @apply text-muted-foreground font-medium rounded-lg;
  @apply transition-all duration-200;
}

.btn-ghost:hover {
  @apply bg-muted text-foreground;
}
```

### Badges

```css
.badge {
  @apply inline-flex items-center gap-1.5 px-2.5 py-0.5;
  @apply text-xs font-medium rounded-full;
}

.badge-default { @apply bg-muted text-muted-foreground; }
.badge-primary { @apply bg-accent text-primary; }
.badge-success { background: rgba(16, 185, 129, 0.1); @apply text-success; }
.badge-warning { background: rgba(245, 158, 11, 0.1); @apply text-warning; }
.badge-error { background: rgba(239, 68, 68, 0.1); @apply text-error; }
```

### Navigation Items

```css
.nav-item {
  @apply flex items-center gap-3 px-3 py-2.5 rounded-lg;
  @apply text-muted-foreground font-medium;
  @apply transition-all duration-200 cursor-pointer;
}

.nav-item:hover {
  @apply bg-muted text-foreground;
}

.nav-item.active {
  @apply bg-accent text-primary;
}
```

### Inputs

```css
.input-premium {
  @apply w-full px-4 py-3 rounded-lg;
  @apply bg-background border border-border;
  @apply text-foreground placeholder:text-muted-foreground;
  @apply transition-all duration-200;
  @apply focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary;
}
```

### Tables

```css
.table-premium th {
  @apply text-left text-xs font-medium text-muted-foreground uppercase tracking-wider;
  @apply px-4 py-3 border-b border-border;
}

.table-premium td {
  @apply px-4 py-4 border-b border-border;
}

.table-premium tr:hover td {
  @apply bg-muted/50;
}
```

---

## Animation

### Fade In

```css
.animate-in {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Slide Up

```css
.animate-slide-up {
  animation: slideUp 0.4s ease-out;
}

@keyframes slideUp {
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
}
```

### Staggered Children

```css
.stagger > * {
  animation: fadeIn 0.4s ease-out backwards;
}

.stagger > *:nth-child(1) { animation-delay: 0ms; }
.stagger > *:nth-child(2) { animation-delay: 50ms; }
.stagger > *:nth-child(3) { animation-delay: 100ms; }
.stagger > *:nth-child(4) { animation-delay: 150ms; }
```

---

## Layout

### Page Structure

```
┌──────────────────────────────────────────────────────────────────┐
│  Sidebar (256px)    │  Header (64px)                             │
│                     │  ────────────────────────────────────────  │
│  ┌───────────────┐  │                                            │
│  │ Logo          │  │  Page Content (p-8)                        │
│  ├───────────────┤  │                                            │
│  │ Navigation    │  │  ┌────────────────────────────────────────┐│
│  │ - Dashboard   │  │  │ Stats Grid (4 cols)                    ││
│  │ - Vendors     │  │  └────────────────────────────────────────┘│
│  │ - Documents   │  │                                            │
│  │ - Reports     │  │  ┌──────────────────────┐ ┌───────────────┐│
│  │ - RoI Export  │  │  │ Main Card (2 cols)   │ │ Side Card     ││
│  ├───────────────┤  │  │                      │ │               ││
│  │ Settings      │  │  └──────────────────────┘ └───────────────┘│
│  │ - Team        │  │                                            │
│  │ - Settings    │  │                                            │
│  ├───────────────┤  │                                            │
│  │ User Profile  │  │                                            │
│  └───────────────┘  │                                            │
└──────────────────────────────────────────────────────────────────┘
```

### Grid Patterns

```tsx
// Stats Row
<div className="grid grid-cols-4 gap-6">

// Main + Sidebar
<div className="grid grid-cols-3 gap-6">
  <div className="col-span-2">Main</div>
  <div>Sidebar</div>
</div>
```

---

## Dark Mode

Full dark mode support with CSS variables:

```css
.dark {
  --background: #0A0A0B;
  --foreground: #FAFAFA;
  --card: #18181B;
  --primary: #F0927A;
  --muted: #27272A;
  --border: #27272A;
}
```

---

## Files Reference

| File | Purpose |
|------|---------|
| `src/app/globals.css` | Complete design system implementation |
| `src/app/theme/page.tsx` | Live theme preview page |

---

## Preview

View the live design system at: **http://localhost:3000/theme**
