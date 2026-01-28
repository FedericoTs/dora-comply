/**
 * Stress Test: Vendor Wizard Multi-Framework Implementation
 *
 * Run with: npx tsx scripts/test-vendor-wizard.ts
 */

import { createVendorSchema, step1Schema, step2Schema } from '../src/lib/vendors/schemas';

console.log('\n🧪 Vendor Wizard Stress Tests\n');
console.log('='.repeat(60) + '\n');

let passed = 0;
let failed = 0;

function test(name: string, fn: () => boolean) {
  try {
    const result = fn();
    if (result) {
      console.log(`✅ ${name}`);
      passed++;
    } else {
      console.log(`❌ ${name}`);
      failed++;
    }
  } catch (error) {
    console.log(`❌ ${name} - Error: ${error instanceof Error ? error.message : error}`);
    failed++;
  }
}

// ============================================================================
// Step 1: Identity & Contact Validation
// ============================================================================
console.log('📋 Step 1: Identity & Contact\n');

test('Requires name field', () => {
  const result = step1Schema.safeParse({ website: 'example.com' });
  return !result.success && result.error.issues.some(i => i.path.includes('name'));
});

test('Requires website field', () => {
  const result = step1Schema.safeParse({ name: 'Test Vendor' });
  return !result.success && result.error.issues.some(i => i.path.includes('website'));
});

test('Accepts valid step 1 data', () => {
  const result = step1Schema.safeParse({
    name: 'Acme Corp',
    website: 'acme.com',
    headquarters_country: 'US',
    industry: 'technology',
  });
  return result.success;
});

test('Validates LEI format (20 chars)', () => {
  const result = step1Schema.safeParse({
    name: 'Test',
    website: 'test.com',
    lei: 'INVALID',
  });
  return !result.success;
});

test('Accepts valid LEI', () => {
  // Valid LEI example (Apple Inc)
  const result = step1Schema.safeParse({
    name: 'Apple',
    website: 'apple.com',
    lei: 'HWUPKR0MPOU8FGXBT394',
  });
  return result.success;
});

test('Validates industry enum values', () => {
  const result = step1Schema.safeParse({
    name: 'Test',
    website: 'test.com',
    industry: 'invalid_industry',
  });
  return !result.success;
});

test('Accepts all valid industries', () => {
  const industries = [
    'financial_services', 'healthcare', 'technology', 'manufacturing',
    'retail', 'energy', 'telecommunications', 'transportation',
    'government', 'education', 'professional_services', 'other'
  ];
  return industries.every(industry => {
    const result = step1Schema.safeParse({
      name: 'Test',
      website: 'test.com',
      industry,
    });
    return result.success;
  });
});

test('Cleans website URL (removes protocol)', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'https://www.example.com/path',
    tier: 'standard',
  });
  if (!result.success) return false;
  return result.data.website === 'www.example.com';
});

test('Validates country code (2 chars)', () => {
  const result = step1Schema.safeParse({
    name: 'Test',
    website: 'test.com',
    headquarters_country: 'USA', // Should be 2 chars
  });
  return !result.success;
});

// ============================================================================
// Step 2: Risk & Compliance Validation
// ============================================================================
console.log('\n📋 Step 2: Risk & Compliance\n');

test('Requires tier field', () => {
  const result = step2Schema.safeParse({});
  return !result.success && result.error.issues.some(i => i.path.includes('tier'));
});

test('Accepts all valid tiers', () => {
  const tiers = ['critical', 'important', 'standard'];
  return tiers.every(tier => {
    const result = step2Schema.safeParse({ tier });
    return result.success;
  });
});

test('Validates tier enum values', () => {
  const result = step2Schema.safeParse({ tier: 'invalid_tier' });
  return !result.success;
});

test('Accepts all valid frameworks', () => {
  const frameworks = ['nis2', 'dora', 'soc2', 'iso27001', 'gdpr', 'hipaa'];
  const result = step2Schema.safeParse({
    tier: 'standard',
    applicable_frameworks: frameworks,
  });
  return result.success;
});

test('Validates framework enum values', () => {
  const result = step2Schema.safeParse({
    tier: 'standard',
    applicable_frameworks: ['invalid_framework'],
  });
  return !result.success;
});

test('Accepts empty frameworks array', () => {
  const result = step2Schema.safeParse({
    tier: 'standard',
    applicable_frameworks: [],
  });
  return result.success;
});

test('Validates provider_type enum', () => {
  const validTypes = ['ict_service_provider', 'cloud_service_provider', 'data_centre', 'network_provider', 'other'];
  return validTypes.every(type => {
    const result = step2Schema.safeParse({
      tier: 'standard',
      provider_type: type,
    });
    return result.success;
  });
});

test('Validates service_types array', () => {
  const validServices = [
    'cloud_computing', 'software_as_service', 'platform_as_service',
    'infrastructure_as_service', 'data_analytics', 'data_management',
    'network_services', 'security_services', 'payment_services', 'hardware', 'other'
  ];
  const result = step2Schema.safeParse({
    tier: 'critical',
    service_types: validServices,
  });
  return result.success;
});

// ============================================================================
// Full Form Validation
// ============================================================================
console.log('\n📋 Full Form Validation\n');

test('Accepts minimal valid form', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test Vendor',
    website: 'testvendor.com',
    tier: 'standard',
  });
  return result.success;
});

test('Accepts complete form with all fields', () => {
  const result = createVendorSchema.safeParse({
    name: 'Complete Vendor Inc',
    website: 'complete-vendor.com',
    lei: 'HWUPKR0MPOU8FGXBT394',
    headquarters_country: 'DE',
    industry: 'financial_services',
    tier: 'critical',
    provider_type: 'cloud_service_provider',
    service_types: ['cloud_computing', 'software_as_service'],
    applicable_frameworks: ['dora', 'nis2', 'soc2'],
    supports_critical_function: true,
    critical_functions: ['Payment Processing', 'Core Banking'],
    is_intra_group: false,
    primary_contact: {
      name: 'John Doe',
      email: 'john@complete-vendor.com',
      phone: '+1-555-0100',
      title: 'Security Officer',
    },
    notes: 'Key vendor for payment processing infrastructure',
  });
  return result.success;
});

test('Rejects form with missing required fields', () => {
  const result = createVendorSchema.safeParse({
    // Missing name, website, tier
    industry: 'technology',
  });
  return !result.success && result.error.issues.length >= 3;
});

test('Validates email in primary_contact', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'test.com',
    tier: 'standard',
    primary_contact: {
      name: 'John',
      email: 'invalid-email',
    },
  });
  return !result.success;
});

test('Accepts primary_contact with valid email', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'test.com',
    tier: 'standard',
    primary_contact: {
      name: 'John',
      email: 'john@test.com',
    },
  });
  return result.success;
});

// ============================================================================
// Edge Cases
// ============================================================================
console.log('\n📋 Edge Cases\n');

test('Handles very long vendor name (max 500)', () => {
  const longName = 'A'.repeat(501);
  const result = createVendorSchema.safeParse({
    name: longName,
    website: 'test.com',
    tier: 'standard',
  });
  return !result.success;
});

test('Accepts max length vendor name (500 chars)', () => {
  const maxName = 'A'.repeat(500);
  const result = createVendorSchema.safeParse({
    name: maxName,
    website: 'test.com',
    tier: 'standard',
  });
  return result.success;
});

test('Trims whitespace from name', () => {
  const result = createVendorSchema.safeParse({
    name: '  Test Vendor  ',
    website: 'test.com',
    tier: 'standard',
  });
  if (!result.success) return false;
  return result.data.name === 'Test Vendor';
});

test('Handles notes with max length (5000)', () => {
  const longNotes = 'A'.repeat(5001);
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'test.com',
    tier: 'standard',
    notes: longNotes,
  });
  return !result.success;
});

test('Handles empty arrays for optional fields', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'test.com',
    tier: 'standard',
    service_types: [],
    applicable_frameworks: [],
    critical_functions: [],
  });
  return result.success;
});

test('Converts website to lowercase', () => {
  const result = createVendorSchema.safeParse({
    name: 'Test',
    website: 'HTTPS://WWW.EXAMPLE.COM/Path',
    tier: 'standard',
  });
  if (!result.success) return false;
  return result.data.website === 'www.example.com';
});

// ============================================================================
// Summary
// ============================================================================
console.log('\n' + '='.repeat(60));
console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed > 0) {
  process.exit(1);
}
