-- ============================================================================
-- DORA RoI Test Data Seeding Script
-- ============================================================================
-- Run this in Supabase SQL Editor to populate test data from test-documents/
--
-- IMPORTANT: Replace 'YOUR_ORGANIZATION_ID' with your actual organization ID
-- You can find it by running: SELECT id FROM organizations LIMIT 1;
-- ============================================================================

-- First, get your organization ID
-- SELECT id, name FROM organizations;

-- Set your organization ID here (replace with actual UUID)
DO $$
DECLARE
    org_id UUID := 'YOUR_ORGANIZATION_ID'::UUID; -- REPLACE THIS!
    vendor_id UUID;
    contract_id UUID;
BEGIN

-- ============================================================================
-- STEP 1: Create Vendor (B_02.02)
-- From: 01-MASTER-SERVICE-AGREEMENT.md, 04-VENDOR-DUE-DILIGENCE.md
-- ============================================================================

INSERT INTO vendors (
    organization_id, name, lei, tier, status,
    service_types, supports_critical_function, primary_contact, metadata
)
VALUES (
    org_id,
    'CloudTech Solutions GmbH',
    '5493001KJTIIGC8Y1R17',
    'critical',
    'active',
    ARRAY['cloud_infrastructure', 'saas', 'security'],
    true,
    '{"name": "Lisa Fischer", "email": "l.fischer@cloudtech.de", "phone": "+49 30 1234 5604"}'::jsonb,
    '{
        "registration_number": "HRB 123456",
        "headquarters_country": "DE",
        "address": "Friedrichstrasse 123, 10117 Berlin, Germany",
        "parent_company": "CloudTech Holdings Ltd",
        "parent_lei": "549300EXAMPLE123456"
    }'::jsonb
)
ON CONFLICT (organization_id, lei) DO UPDATE SET
    name = EXCLUDED.name,
    tier = EXCLUDED.tier,
    status = EXCLUDED.status
RETURNING id INTO vendor_id;

RAISE NOTICE 'Created vendor with ID: %', vendor_id;

-- ============================================================================
-- STEP 2: Create Contract (B_03.01)
-- From: 01-MASTER-SERVICE-AGREEMENT.md
-- ============================================================================

INSERT INTO contracts (
    organization_id, vendor_id, contract_reference, contract_type,
    signing_date, effective_date, expiry_date, auto_renewal,
    termination_notice_days, annual_value, currency, status, metadata
)
VALUES (
    org_id,
    vendor_id,
    'MSA-2025-CLOUD-001',
    'master_agreement',
    '2025-01-15',
    '2025-02-01',
    '2028-01-31',
    true,
    180,
    2500000,
    'EUR',
    'active',
    '{
        "governing_law": "Germany",
        "jurisdiction": "Frankfurt am Main",
        "provider_notice_days": 365
    }'::jsonb
)
ON CONFLICT (organization_id, contract_reference) DO UPDATE SET
    vendor_id = EXCLUDED.vendor_id,
    status = EXCLUDED.status
RETURNING id INTO contract_id;

RAISE NOTICE 'Created contract with ID: %', contract_id;

-- ============================================================================
-- STEP 3: Create ICT Services (B_04.01)
-- From: 07-ICT-SERVICE-REGISTER.md
-- ============================================================================

INSERT INTO ict_services (organization_id, vendor_id, contract_id, service_identifier, service_type, description, supports_critical_function, annual_cost, currency)
VALUES
    (org_id, vendor_id, contract_id, 'SVC-001', 'cloud_iaas', 'Virtual server infrastructure hosting including compute, storage, and networking', true, 850000, 'EUR'),
    (org_id, vendor_id, contract_id, 'SVC-002', 'saas', 'Core banking platform providing account management, transactions, and customer services', true, 1200000, 'EUR'),
    (org_id, vendor_id, contract_id, 'SVC-003', 'data_management', 'Managed PostgreSQL database hosting with high availability and automated backups', true, 320000, 'EUR'),
    (org_id, vendor_id, contract_id, 'SVC-004', 'security', '24/7 Security Operations Center with threat detection and incident response', true, 180000, 'EUR'),
    (org_id, vendor_id, contract_id, 'SVC-005', 'bcm', 'Disaster recovery infrastructure with automated failover and 4-hour RTO', true, 150000, 'EUR')
ON CONFLICT (organization_id, service_identifier) DO NOTHING;

RAISE NOTICE 'Created 5 ICT services';

-- ============================================================================
-- STEP 4: Create Data Locations (B_05.01, B_05.02)
-- From: 03-DATA-PROCESSING-AGREEMENT.md
-- ============================================================================

INSERT INTO service_data_locations (organization_id, vendor_id, data_type, storage_country, storage_city, processing_country, data_center_name, is_primary)
VALUES
    (org_id, vendor_id, 'customer_pii', 'DE', 'Frankfurt', 'DE', 'CloudTech DC-FRA', true),
    (org_id, vendor_id, 'transaction_data', 'DE', 'Frankfurt', 'DE', 'CloudTech DC-FRA', true),
    (org_id, vendor_id, 'authentication_data', 'DE', 'Frankfurt', 'DE', 'CloudTech DC-FRA', true),
    (org_id, vendor_id, 'backup_data', 'NL', 'Amsterdam', 'NL', 'DC Europe AMS', false),
    (org_id, vendor_id, 'dr_data', 'IE', 'Dublin', 'IE', 'AWS EU-WEST', false)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Created 5 data locations';

-- ============================================================================
-- STEP 5: Create Critical Functions (B_06.01)
-- From: 05-CRITICAL-FUNCTIONS-REGISTER.md
-- ============================================================================

INSERT INTO critical_functions (organization_id, function_code, function_name, licensed_activity, criticality, rto_hours, rpo_hours, business_impact)
VALUES
    (org_id, 'CF-001', 'Payment Processing', 'Payment Services (PSD2)', 'critical', 2, 0, 'Immediate regulatory breach, customer harm'),
    (org_id, 'CF-002', 'Customer Deposit Management', 'Deposit Taking (CRD)', 'critical', 4, 1, 'Regulatory breach, liquidity risk'),
    (org_id, 'CF-003', 'Lending Operations', 'Credit Provision (CRD)', 'critical', 8, 4, 'Revenue loss, customer impact'),
    (org_id, 'CF-004', 'Regulatory Reporting', 'All Licensed Activities', 'critical', 24, 4, 'Regulatory sanctions'),
    (org_id, 'CF-005', 'AML/KYC Operations', 'All Customer-Facing', 'critical', 4, 1, 'Regulatory breach, sanctions'),
    (org_id, 'CF-006', 'Treasury Operations', 'Investment Services', 'critical', 2, 0.25, 'Liquidity risk, market risk'),
    (org_id, 'CF-007', 'Cybersecurity Operations', 'All', 'critical', 0, 0, 'Security exposure, regulatory breach'),
    (org_id, 'CF-008', 'Core Banking Operations', 'Banking License', 'critical', 4, 1, 'Complete operational failure')
ON CONFLICT (organization_id, function_code) DO NOTHING;

RAISE NOTICE 'Created 8 critical functions';

-- ============================================================================
-- STEP 6: Create Subcontractors (B_99.01)
-- From: 01-MASTER-SERVICE-AGREEMENT.md
-- ============================================================================

INSERT INTO subcontractors (organization_id, vendor_id, name, lei, country, service_description, subcontracting_rank)
VALUES
    (org_id, vendor_id, 'DataCenter Europe BV', '549300DCENTER12345', 'NL', 'Data center colocation', 1),
    (org_id, vendor_id, 'SecureNet AG', '549300SECNET67890', 'DE', 'Network security monitoring', 2),
    (org_id, vendor_id, 'BackupSafe GmbH', '549300BACKUP11111', 'DE', 'Encrypted backup services', 3)
ON CONFLICT (organization_id, lei) DO NOTHING;

RAISE NOTICE 'Created 3 subcontractors';

-- ============================================================================
-- STEP 7: Create Function-Service Mappings (B_07.01)
-- From: 05-CRITICAL-FUNCTIONS-REGISTER.md
-- ============================================================================

-- Get function and service IDs and create mappings
INSERT INTO function_service_mapping (organization_id, function_id, service_id, reliance_level)
SELECT
    org_id,
    cf.id,
    ics.id,
    'high'
FROM critical_functions cf
CROSS JOIN ict_services ics
WHERE cf.organization_id = org_id
AND ics.organization_id = org_id
AND (
    (cf.function_code = 'CF-001' AND ics.service_identifier IN ('SVC-001', 'SVC-002'))
    OR (cf.function_code = 'CF-002' AND ics.service_identifier IN ('SVC-002', 'SVC-003'))
    OR (cf.function_code = 'CF-003' AND ics.service_identifier IN ('SVC-002', 'SVC-003'))
    OR (cf.function_code = 'CF-004' AND ics.service_identifier IN ('SVC-002', 'SVC-003'))
    OR (cf.function_code = 'CF-005' AND ics.service_identifier = 'SVC-002')
    OR (cf.function_code = 'CF-007' AND ics.service_identifier = 'SVC-004')
    OR (cf.function_code = 'CF-008' AND ics.service_identifier IN ('SVC-001', 'SVC-002', 'SVC-003'))
)
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Created function-service mappings';

-- ============================================================================
-- STEP 8: Create Vendor Contacts (B_02.01)
-- ============================================================================

INSERT INTO vendor_contacts (organization_id, vendor_id, contact_type, name, email, phone)
VALUES
    (org_id, vendor_id, 'account_manager', 'Lisa Fischer', 'l.fischer@cloudtech.de', '+49 30 1234 5604'),
    (org_id, vendor_id, 'dpo', 'Anna Schneider', 'dpo@cloudtech.de', '+49 30 1234 5603'),
    (org_id, vendor_id, 'technical_support', 'Jan Becker', 'support@cloudtech.de', '+49 30 1234 5605'),
    (org_id, vendor_id, 'ceo', 'Dr. Hans Mueller', 'h.mueller@cloudtech.de', '+49 30 1234 5600')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Created 4 vendor contacts';

-- ============================================================================
-- STEP 9: Create Contract Contacts (B_03.02)
-- ============================================================================

INSERT INTO contract_contacts (organization_id, contract_id, contact_type, name, email, phone)
VALUES
    (org_id, contract_id, 'contract_owner', 'Peter Weber', 'p.weber@eurofinance.de', '+49 69 1234 5700'),
    (org_id, contract_id, 'legal', 'Dr. Sandra Braun', 's.braun@eurofinance.de', '+49 69 1234 5701')
ON CONFLICT DO NOTHING;

RAISE NOTICE 'Created 2 contract contacts';

RAISE NOTICE '';
RAISE NOTICE '✅ Test data seeding complete!';
RAISE NOTICE '';
RAISE NOTICE 'Summary:';
RAISE NOTICE '  - 1 Vendor (CloudTech Solutions GmbH)';
RAISE NOTICE '  - 1 Contract (MSA-2025-CLOUD-001)';
RAISE NOTICE '  - 5 ICT Services';
RAISE NOTICE '  - 5 Data Locations';
RAISE NOTICE '  - 8 Critical Functions';
RAISE NOTICE '  - 3 Subcontractors';
RAISE NOTICE '  - Function-Service Mappings';
RAISE NOTICE '';
RAISE NOTICE 'Next: Go to /roi to view the RoI dashboard';

END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Uncomment these to verify the data was created:

-- SELECT 'Vendors' as table_name, COUNT(*) as count FROM vendors;
-- SELECT 'Contracts' as table_name, COUNT(*) as count FROM contracts;
-- SELECT 'ICT Services' as table_name, COUNT(*) as count FROM ict_services;
-- SELECT 'Data Locations' as table_name, COUNT(*) as count FROM service_data_locations;
-- SELECT 'Critical Functions' as table_name, COUNT(*) as count FROM critical_functions;
-- SELECT 'Subcontractors' as table_name, COUNT(*) as count FROM subcontractors;
-- SELECT 'Function-Service Maps' as table_name, COUNT(*) as count FROM function_service_mapping;
