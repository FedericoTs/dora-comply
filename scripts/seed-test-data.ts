/**
 * Test Data Seeding Script for DORA RoI Validation
 *
 * This script populates the database with test data from the test-documents/
 * folder to enable full RoI export validation testing.
 *
 * Usage: npx tsx scripts/seed-test-data.ts
 *
 * Prerequisites:
 * - Supabase project configured
 * - User logged in with organization
 */

import { createClient } from '@supabase/supabase-js';

// Configuration - Update these with your values
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Test data based on test-documents/
const TEST_DATA = {
  // From 01-MASTER-SERVICE-AGREEMENT.md and 04-VENDOR-DUE-DILIGENCE.md
  organization: {
    name: 'EuroFinance Bank AG',
    lei: '529900ABCDEFGHIJ1234', // Note: This is a test LEI
    type: 'credit_institution',
    country: 'DE',
    competent_authority: 'BaFin',
    address: 'Kaiserstrasse 45, 60329 Frankfurt, Germany'
  },

  // Organization contacts (B_01.02)
  organizationContacts: [
    {
      role: 'dpo',
      name: 'Dr. Klaus Weber',
      email: 'dpo@eurofinance.de',
      phone: '+49 69 1234 5600'
    },
    {
      role: 'ciso',
      name: 'Michael Neumann',
      email: 'ciso@eurofinance.de',
      phone: '+49 69 1234 5601'
    }
  ],

  // Vendor (B_02.02) - from test documents
  vendor: {
    name: 'CloudTech Solutions GmbH',
    lei: '5493001KJTIIGC8Y1R17', // This is a test LEI
    registration_number: 'HRB 123456',
    country: 'DE',
    headquarters_country: 'DE',
    address: 'Friedrichstrasse 123, 10117 Berlin, Germany',
    parent_company: 'CloudTech Holdings Ltd',
    parent_lei: '549300EXAMPLE123456',
    tier: 'critical',
    status: 'active',
    service_types: ['cloud_infrastructure', 'saas', 'security'],
    supports_critical_function: true
  },

  // Vendor contacts (B_02.01)
  vendorContacts: [
    {
      role: 'account_manager',
      name: 'Lisa Fischer',
      email: 'l.fischer@cloudtech.de',
      phone: '+49 30 1234 5604'
    },
    {
      role: 'dpo',
      name: 'Anna Schneider',
      email: 'dpo@cloudtech.de',
      phone: '+49 30 1234 5603'
    },
    {
      role: 'support',
      name: 'Jan Becker',
      email: 'support@cloudtech.de',
      phone: '+49 30 1234 5605'
    }
  ],

  // Contract (B_03.01) - from 01-MASTER-SERVICE-AGREEMENT.md
  contract: {
    contract_reference: 'MSA-2025-CLOUD-001',
    contract_type: 'master_agreement',
    signing_date: '2025-01-15',
    effective_date: '2025-02-01',
    expiry_date: '2028-01-31',
    auto_renewal: true,
    termination_notice_days: 180,
    provider_notice_days: 365,
    annual_value: 2500000,
    currency: 'EUR',
    governing_law: 'Germany',
    jurisdiction: 'Frankfurt am Main',
    status: 'active'
  },

  // ICT Services (B_04.01) - from 07-ICT-SERVICE-REGISTER.md
  services: [
    {
      service_id: 'SVC-001',
      service_type: 'cloud_iaas',
      description: 'Virtual server infrastructure hosting including compute, storage, and networking',
      supports_critical_function: true,
      annual_cost: 850000,
      currency: 'EUR'
    },
    {
      service_id: 'SVC-002',
      service_type: 'saas',
      description: 'Core banking platform providing account management, transactions, and customer services',
      supports_critical_function: true,
      annual_cost: 1200000,
      currency: 'EUR'
    },
    {
      service_id: 'SVC-003',
      service_type: 'data_management',
      description: 'Managed PostgreSQL database hosting with high availability and automated backups',
      supports_critical_function: true,
      annual_cost: 320000,
      currency: 'EUR'
    },
    {
      service_id: 'SVC-004',
      service_type: 'security',
      description: '24/7 Security Operations Center with threat detection, incident response, and vulnerability management',
      supports_critical_function: true,
      annual_cost: 180000,
      currency: 'EUR'
    },
    {
      service_id: 'SVC-005',
      service_type: 'bcm',
      description: 'Disaster recovery infrastructure with automated failover and 4-hour RTO',
      supports_critical_function: true,
      annual_cost: 150000,
      currency: 'EUR'
    }
  ],

  // Data locations (B_05.01, B_05.02) - from 03-DATA-PROCESSING-AGREEMENT.md
  dataLocations: [
    {
      data_type: 'customer_pii',
      storage_country: 'DE',
      storage_city: 'Frankfurt',
      processing_country: 'DE',
      data_center: 'CloudTech DC-FRA',
      is_primary: true
    },
    {
      data_type: 'transaction_data',
      storage_country: 'DE',
      storage_city: 'Frankfurt',
      processing_country: 'DE',
      data_center: 'CloudTech DC-FRA',
      is_primary: true
    },
    {
      data_type: 'backup_data',
      storage_country: 'NL',
      storage_city: 'Amsterdam',
      processing_country: 'NL',
      data_center: 'DC Europe AMS',
      is_primary: false
    },
    {
      data_type: 'dr_data',
      storage_country: 'IE',
      storage_city: 'Dublin',
      processing_country: 'IE',
      data_center: 'AWS EU-WEST',
      is_primary: false
    }
  ],

  // Critical functions (B_06.01) - from 05-CRITICAL-FUNCTIONS-REGISTER.md
  criticalFunctions: [
    {
      function_code: 'CF-001',
      function_name: 'Payment Processing',
      licensed_activity: 'Payment Services (PSD2)',
      criticality: 'critical',
      rto_hours: 2,
      rpo_hours: 0,
      business_impact: 'Immediate regulatory breach, customer harm'
    },
    {
      function_code: 'CF-002',
      function_name: 'Customer Deposit Management',
      licensed_activity: 'Deposit Taking (CRD)',
      criticality: 'critical',
      rto_hours: 4,
      rpo_hours: 1,
      business_impact: 'Regulatory breach, liquidity risk'
    },
    {
      function_code: 'CF-003',
      function_name: 'Lending Operations',
      licensed_activity: 'Credit Provision (CRD)',
      criticality: 'critical',
      rto_hours: 8,
      rpo_hours: 4,
      business_impact: 'Revenue loss, customer impact'
    },
    {
      function_code: 'CF-004',
      function_name: 'Regulatory Reporting',
      licensed_activity: 'All Licensed Activities',
      criticality: 'critical',
      rto_hours: 24,
      rpo_hours: 4,
      business_impact: 'Regulatory sanctions'
    },
    {
      function_code: 'CF-005',
      function_name: 'AML/KYC Operations',
      licensed_activity: 'All Customer-Facing',
      criticality: 'critical',
      rto_hours: 4,
      rpo_hours: 1,
      business_impact: 'Regulatory breach, sanctions'
    },
    {
      function_code: 'CF-007',
      function_name: 'Cybersecurity Operations',
      licensed_activity: 'All',
      criticality: 'critical',
      rto_hours: 0,
      rpo_hours: 0,
      business_impact: 'Security exposure, regulatory breach'
    },
    {
      function_code: 'CF-008',
      function_name: 'Core Banking Operations',
      licensed_activity: 'Banking License',
      criticality: 'critical',
      rto_hours: 4,
      rpo_hours: 1,
      business_impact: 'Complete operational failure'
    }
  ],

  // Function-Service mapping (B_07.01)
  functionServiceMapping: [
    { function_code: 'CF-001', service_id: 'SVC-001' },
    { function_code: 'CF-001', service_id: 'SVC-002' },
    { function_code: 'CF-002', service_id: 'SVC-002' },
    { function_code: 'CF-002', service_id: 'SVC-003' },
    { function_code: 'CF-003', service_id: 'SVC-002' },
    { function_code: 'CF-003', service_id: 'SVC-003' },
    { function_code: 'CF-004', service_id: 'SVC-002' },
    { function_code: 'CF-004', service_id: 'SVC-003' },
    { function_code: 'CF-005', service_id: 'SVC-002' },
    { function_code: 'CF-007', service_id: 'SVC-004' },
    { function_code: 'CF-008', service_id: 'SVC-001' },
    { function_code: 'CF-008', service_id: 'SVC-002' },
    { function_code: 'CF-008', service_id: 'SVC-003' }
  ],

  // Subcontractors (B_99.01) - from 01-MASTER-SERVICE-AGREEMENT.md
  subcontractors: [
    {
      name: 'DataCenter Europe BV',
      lei: '549300DCENTER12345',
      country: 'NL',
      service_description: 'Data center colocation',
      rank: 1
    },
    {
      name: 'SecureNet AG',
      lei: '549300SECNET67890',
      country: 'DE',
      service_description: 'Network security monitoring',
      rank: 2
    },
    {
      name: 'BackupSafe GmbH',
      lei: '549300BACKUP11111',
      country: 'DE',
      service_description: 'Encrypted backup services',
      rank: 3
    }
  ],

  // Exit strategy data - from 06-EXIT-STRATEGY.md
  exitStrategy: {
    substitutability: 'medium',
    exit_duration_months: 12,
    exit_cost_eur: 3250000,
    data_volume_tb: 45,
    reintegration_possible: false,
    alternative_providers: ['AWS', 'Microsoft Azure', 'Google Cloud Platform']
  }
};

async function seedTestData() {
  console.log('🌱 Starting test data seeding...\n');

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  // Get or create organization
  console.log('1️⃣ Checking organization...');
  const { data: existingOrgs } = await supabase
    .from('organizations')
    .select('id, name')
    .limit(1);

  let organizationId: string;

  if (existingOrgs && existingOrgs.length > 0) {
    organizationId = existingOrgs[0].id;
    console.log(`   Using existing organization: ${existingOrgs[0].name} (${organizationId})`);
  } else {
    console.log('   ❌ No organization found. Please create one through the UI first.');
    process.exit(1);
  }

  // Create vendor
  console.log('\n2️⃣ Creating vendor...');
  const { data: vendor, error: vendorError } = await supabase
    .from('vendors')
    .upsert({
      organization_id: organizationId,
      name: TEST_DATA.vendor.name,
      lei: TEST_DATA.vendor.lei,
      tier: TEST_DATA.vendor.tier,
      status: TEST_DATA.vendor.status,
      service_types: TEST_DATA.vendor.service_types,
      supports_critical_function: TEST_DATA.vendor.supports_critical_function,
      primary_contact: {
        name: TEST_DATA.vendorContacts[0].name,
        email: TEST_DATA.vendorContacts[0].email,
        phone: TEST_DATA.vendorContacts[0].phone
      },
      metadata: {
        registration_number: TEST_DATA.vendor.registration_number,
        headquarters_country: TEST_DATA.vendor.headquarters_country,
        address: TEST_DATA.vendor.address,
        parent_company: TEST_DATA.vendor.parent_company,
        parent_lei: TEST_DATA.vendor.parent_lei
      }
    }, { onConflict: 'organization_id,lei' })
    .select()
    .single();

  if (vendorError) {
    console.log(`   ❌ Error creating vendor: ${vendorError.message}`);
  } else {
    console.log(`   ✅ Vendor created: ${vendor.name} (${vendor.id})`);
  }

  const vendorId = vendor?.id;

  // Create contract
  if (vendorId) {
    console.log('\n3️⃣ Creating contract...');
    const { data: contract, error: contractError } = await supabase
      .from('contracts')
      .upsert({
        organization_id: organizationId,
        vendor_id: vendorId,
        contract_reference: TEST_DATA.contract.contract_reference,
        contract_type: TEST_DATA.contract.contract_type,
        signing_date: TEST_DATA.contract.signing_date,
        effective_date: TEST_DATA.contract.effective_date,
        expiry_date: TEST_DATA.contract.expiry_date,
        auto_renewal: TEST_DATA.contract.auto_renewal,
        termination_notice_days: TEST_DATA.contract.termination_notice_days,
        annual_value: TEST_DATA.contract.annual_value,
        currency: TEST_DATA.contract.currency,
        status: TEST_DATA.contract.status,
        metadata: {
          governing_law: TEST_DATA.contract.governing_law,
          jurisdiction: TEST_DATA.contract.jurisdiction,
          provider_notice_days: TEST_DATA.contract.provider_notice_days
        }
      }, { onConflict: 'organization_id,contract_reference' })
      .select()
      .single();

    if (contractError) {
      console.log(`   ❌ Error creating contract: ${contractError.message}`);
    } else {
      console.log(`   ✅ Contract created: ${contract.contract_reference} (${contract.id})`);
    }

    const contractId = contract?.id;

    // Create ICT services
    if (contractId) {
      console.log('\n4️⃣ Creating ICT services...');
      for (const service of TEST_DATA.services) {
        const { error: serviceError } = await supabase
          .from('ict_services')
          .upsert({
            organization_id: organizationId,
            vendor_id: vendorId,
            contract_id: contractId,
            service_identifier: service.service_id,
            service_type: service.service_type,
            description: service.description,
            supports_critical_function: service.supports_critical_function,
            annual_cost: service.annual_cost,
            currency: service.currency
          }, { onConflict: 'organization_id,service_identifier' });

        if (serviceError) {
          console.log(`   ❌ Error creating service ${service.service_id}: ${serviceError.message}`);
        } else {
          console.log(`   ✅ Service created: ${service.service_id}`);
        }
      }
    }

    // Create subcontractors
    console.log('\n5️⃣ Creating subcontractors...');
    for (const sub of TEST_DATA.subcontractors) {
      const { error: subError } = await supabase
        .from('subcontractors')
        .upsert({
          organization_id: organizationId,
          vendor_id: vendorId,
          name: sub.name,
          lei: sub.lei,
          country: sub.country,
          service_description: sub.service_description,
          subcontracting_rank: sub.rank
        }, { onConflict: 'organization_id,lei' });

      if (subError) {
        console.log(`   ❌ Error creating subcontractor ${sub.name}: ${subError.message}`);
      } else {
        console.log(`   ✅ Subcontractor created: ${sub.name} (rank ${sub.rank})`);
      }
    }
  }

  // Create critical functions
  console.log('\n6️⃣ Creating critical functions...');
  for (const func of TEST_DATA.criticalFunctions) {
    const { error: funcError } = await supabase
      .from('critical_functions')
      .upsert({
        organization_id: organizationId,
        function_code: func.function_code,
        function_name: func.function_name,
        licensed_activity: func.licensed_activity,
        criticality: func.criticality,
        rto_hours: func.rto_hours,
        rpo_hours: func.rpo_hours,
        business_impact: func.business_impact
      }, { onConflict: 'organization_id,function_code' });

    if (funcError) {
      console.log(`   ❌ Error creating function ${func.function_code}: ${funcError.message}`);
    } else {
      console.log(`   ✅ Function created: ${func.function_code} - ${func.function_name}`);
    }
  }

  // Create data locations
  console.log('\n7️⃣ Creating data locations...');
  for (const loc of TEST_DATA.dataLocations) {
    const { error: locError } = await supabase
      .from('service_data_locations')
      .insert({
        organization_id: organizationId,
        vendor_id: vendorId,
        data_type: loc.data_type,
        storage_country: loc.storage_country,
        storage_city: loc.storage_city,
        processing_country: loc.processing_country,
        data_center_name: loc.data_center,
        is_primary: loc.is_primary
      });

    if (locError && !locError.message.includes('duplicate')) {
      console.log(`   ❌ Error creating location: ${locError.message}`);
    } else {
      console.log(`   ✅ Data location created: ${loc.data_type} in ${loc.storage_country}`);
    }
  }

  console.log('\n✅ Test data seeding complete!\n');
  console.log('Next steps:');
  console.log('1. Go to /roi to view the RoI dashboard');
  console.log('2. Check each template for populated data');
  console.log('3. Export the xBRL-CSV package');
  console.log('4. Upload to https://www.doravalidator.com/ for validation');
}

// Run if called directly
seedTestData().catch(console.error);
