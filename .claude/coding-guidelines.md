# Coding Guidelines

## Overview

These guidelines ensure consistency, maintainability, and high quality across the DORA Comply codebase. All code must adhere to these standards.

---

## TypeScript Standards

### Strict Mode

All code runs in TypeScript strict mode. Never use workarounds that bypass type safety.

```typescript
// GOOD - Explicit types, narrow when needed
function processVendor(vendor: Vendor): ProcessedVendor {
  return {
    id: vendor.id,
    displayName: vendor.name.trim(),
    status: vendor.status ?? 'pending',
  };
}

// BAD - Using 'any'
function processVendor(vendor: any): any { ... }
```

### Type Definitions

```typescript
// Use interface for object shapes
interface Vendor {
  id: string;
  name: string;
  tier: VendorTier;
  status: VendorStatus;
}

// Use type for unions, intersections, mapped types
type VendorTier = 'critical' | 'important' | 'standard';
type VendorStatus = 'active' | 'pending' | 'inactive';
type VendorWithContracts = Vendor & { contracts: Contract[] };

// Extract reusable types
type AsyncAction<T> = () => Promise<T>;
type ErrorHandler = (error: Error) => void;
```

### Null Handling

```typescript
// Use nullish coalescing
const region = user.region ?? 'eu';

// Use optional chaining
const orgName = session?.user?.organization?.name;

// Narrow types explicitly
function getVendor(id: string): Vendor | null {
  const vendor = vendors.find(v => v.id === id);
  if (!vendor) return null;
  return vendor; // TypeScript knows this is Vendor
}
```

---

## React Patterns

### Server Components (Default)

```typescript
// app/vendors/page.tsx
import { createClient } from '@/lib/supabase/server';

export default async function VendorsPage() {
  const supabase = await createClient();
  const { data: vendors } = await supabase
    .from('vendors')
    .select('*')
    .order('name');

  return <VendorList vendors={vendors ?? []} />;
}
```

### Client Components (When Needed)

Only use `'use client'` for:
- Event handlers (onClick, onChange, onSubmit)
- Browser APIs (localStorage, window)
- Hooks that depend on client state (useState, useEffect)
- Third-party client libraries

```typescript
'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

export function VendorForm() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // ...
}
```

### Server Actions

```typescript
// lib/actions/vendors.ts
'use server';

import { createClient } from '@/lib/supabase/server';
import { vendorSchema } from '@/lib/validation/vendor';
import { revalidatePath } from 'next/cache';

export async function createVendor(formData: FormData) {
  const supabase = await createClient();

  // Validate
  const parsed = vendorSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }

  // Insert
  const { data, error } = await supabase
    .from('vendors')
    .insert(parsed.data)
    .select()
    .single();

  if (error) {
    return { error: error.message };
  }

  revalidatePath('/vendors');
  return { data };
}
```

### Component Composition

```typescript
// Use compound components for complex UIs
<Card>
  <Card.Header>
    <Card.Title>Vendor Details</Card.Title>
    <Card.Description>Manage vendor information</Card.Description>
  </Card.Header>
  <Card.Content>
    {/* Content */}
  </Card.Content>
  <Card.Footer>
    <Button>Save</Button>
  </Card.Footer>
</Card>

// Use render props for flexible rendering
<DataTable
  data={vendors}
  columns={columns}
  renderEmpty={() => <EmptyState />}
  renderLoading={() => <Skeleton />}
/>
```

---

## Form Handling

### Zod Schemas

```typescript
// lib/validation/vendor.ts
import { z } from 'zod';

export const vendorSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  lei: z.string().regex(/^[A-Z0-9]{20}$/, 'Invalid LEI format').optional(),
  tier: z.enum(['critical', 'important', 'standard']),
  jurisdiction: z.string().length(2, 'Use ISO 3166-1 alpha-2 code'),
  supports_critical_function: z.boolean().default(false),
});

export type VendorFormData = z.infer<typeof vendorSchema>;
```

### React Hook Form Integration

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { vendorSchema, VendorFormData } from '@/lib/validation/vendor';
import { createVendor } from '@/lib/actions/vendors';

export function VendorForm() {
  const form = useForm<VendorFormData>({
    resolver: zodResolver(vendorSchema),
    defaultValues: {
      tier: 'standard',
      supports_critical_function: false,
    },
  });

  async function onSubmit(data: VendorFormData) {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      formData.append(key, String(value));
    });

    const result = await createVendor(formData);
    if (result.error) {
      // Handle error
    }
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Form fields */}
    </form>
  );
}
```

---

## Styling Guidelines

### Tailwind CSS

```typescript
// Use design system tokens via CSS variables
<div className="bg-background text-foreground">
  <h1 className="text-primary">Title</h1>
</div>

// Use cn() for conditional classes
import { cn } from '@/lib/utils';

<button
  className={cn(
    'btn-primary',
    isLoading && 'opacity-50 cursor-not-allowed',
    variant === 'ghost' && 'btn-ghost'
  )}
>

// Use premium component classes
<div className="card-premium p-6">
  <h2 className="stat-value">1,234</h2>
  <p className="stat-label">Active Vendors</p>
</div>
```

### Component Styling

```typescript
// Keep styles in the component using Tailwind
function VendorCard({ vendor }: { vendor: Vendor }) {
  return (
    <div className="card-elevated p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">{vendor.name}</h3>
        <span className={cn(
          'badge',
          vendor.tier === 'critical' && 'badge-error',
          vendor.tier === 'important' && 'badge-warning',
          vendor.tier === 'standard' && 'badge-default',
        )}>
          {vendor.tier}
        </span>
      </div>
    </div>
  );
}
```

---

## Error Handling

### Server Actions

```typescript
'use server';

type ActionResult<T> =
  | { success: true; data: T }
  | { success: false; error: string };

export async function createVendor(
  formData: FormData
): Promise<ActionResult<Vendor>> {
  try {
    // ... logic
    return { success: true, data: vendor };
  } catch (error) {
    console.error('Failed to create vendor:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
```

### Client Components

```typescript
'use client';

import { toast } from 'sonner';

async function handleSubmit(formData: FormData) {
  setIsLoading(true);
  try {
    const result = await createVendor(formData);
    if (!result.success) {
      toast.error(result.error);
      return;
    }
    toast.success('Vendor created successfully');
    router.push(`/vendors/${result.data.id}`);
  } catch (error) {
    toast.error('Something went wrong. Please try again.');
  } finally {
    setIsLoading(false);
  }
}
```

---

## File Organization

### Feature-Based Structure

```
src/
├── app/
│   └── (dashboard)/
│       └── vendors/
│           ├── page.tsx           # List page
│           ├── [id]/
│           │   └── page.tsx       # Detail page
│           └── new/
│               └── page.tsx       # Create page
├── components/
│   └── vendors/
│       ├── vendor-card.tsx        # Display component
│       ├── vendor-form.tsx        # Form component
│       ├── vendor-list.tsx        # List component
│       └── index.ts               # Barrel export
├── lib/
│   ├── actions/
│   │   └── vendors.ts             # Server actions
│   └── validation/
│       └── vendor.ts              # Zod schemas
└── types/
    └── vendor.ts                  # Type definitions
```

### Import Order

```typescript
// 1. React/Next.js
import { Suspense } from 'react';
import { notFound } from 'next/navigation';

// 2. Third-party libraries
import { z } from 'zod';
import { format } from 'date-fns';

// 3. Internal components
import { Button } from '@/components/ui/button';
import { VendorCard } from '@/components/vendors';

// 4. Internal utilities
import { createClient } from '@/lib/supabase/server';
import { cn } from '@/lib/utils';

// 5. Types (can be inline if simple)
import type { Vendor } from '@/types/vendor';
```

---

## Performance

### Server Components First

- Fetch data in Server Components
- Pass data down to Client Components as props
- Use Suspense boundaries for loading states

```typescript
// app/vendors/page.tsx
import { Suspense } from 'react';
import { VendorList } from '@/components/vendors';
import { VendorListSkeleton } from '@/components/vendors/skeleton';

export default function VendorsPage() {
  return (
    <Suspense fallback={<VendorListSkeleton />}>
      <VendorListServer />
    </Suspense>
  );
}

async function VendorListServer() {
  const vendors = await fetchVendors();
  return <VendorList vendors={vendors} />;
}
```

### Avoid Client-Side Fetching

```typescript
// BAD - Client-side useEffect fetching
'use client';
function VendorList() {
  const [vendors, setVendors] = useState([]);
  useEffect(() => {
    fetch('/api/vendors').then(r => r.json()).then(setVendors);
  }, []);
}

// GOOD - Server Component with direct fetch
async function VendorList() {
  const vendors = await fetchVendors();
  return <ul>{vendors.map(v => <li key={v.id}>{v.name}</li>)}</ul>;
}
```

---

## Accessibility

### Interactive Elements

```typescript
// All buttons must have accessible names
<Button aria-label="Close dialog">
  <X className="h-4 w-4" />
</Button>

// Form inputs must have labels
<Label htmlFor="vendor-name">Vendor Name</Label>
<Input id="vendor-name" name="name" />

// Error messages must be associated
<Input
  id="email"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <p id="email-error" className="text-error text-sm">
    {errors.email.message}
  </p>
)}
```

### Keyboard Navigation

- All interactive elements must be focusable
- Use `tabIndex={0}` for custom interactive elements
- Implement proper focus management in modals

---

## Security

### Input Validation

- Always validate on server, even if validated on client
- Use Zod schemas for consistent validation
- Sanitize user input before database operations

### Authentication

- Check session in Server Components before fetching sensitive data
- Use middleware for route protection
- Never expose sensitive data in client bundles

```typescript
// Always check auth in protected pages
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function ProtectedPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // ... rest of page
}
```
