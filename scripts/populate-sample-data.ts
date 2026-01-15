/**
 * Populate Sample Data for KPI Testing
 *
 * This script adds realistic sample data to the database to test
 * the compliance KPI calculations.
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join } from 'path';

// Load env
const envPath = join(process.cwd(), '.env.local');
const envContent = readFileSync(envPath, 'utf-8');
const env: Record<string, string> = {};
for (const line of envContent.split('\n')) {
  const trimmed = line.trim();
  if (!trimmed || trimmed.startsWith('#')) continue;
  const [key, ...valueParts] = trimmed.split('=');
  if (key && valueParts.length > 0) {
    env[key] = valueParts.join('=').replace(/^["']|["']$/g, '');
  }
}

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Helper to generate random date within range
function randomDate(daysAgo: number, daysAhead: number = 0): string {
  const now = new Date();
  const pastMs = now.getTime() - daysAgo * 24 * 60 * 60 * 1000;
  const futureMs = now.getTime() + daysAhead * 24 * 60 * 60 * 1000;
  const randomMs = pastMs + Math.random() * (futureMs - pastMs);
  return new Date(randomMs).toISOString();
}

function randomDateOnly(daysAgo: number, daysAhead: number = 0): string {
  return randomDate(daysAgo, daysAhead).split('T')[0];
}

async function populateData() {
  console.log('🔄 Populating sample data for KPI testing...\n');

  // Get organization ID
  const { data: users } = await supabase.from('users').select('id, organization_id').limit(1);
  if (!users || users.length === 0) {
    console.error('❌ No users found in database');
    return;
  }
  const orgId = users[0].organization_id;
  const userId = users[0].id;
  console.log(`Organization ID: ${orgId}`);
  console.log(`User ID: ${userId}\n`);

  // ============================================
  // 1. Update Vendors with Financial Data (for HHI)
  // ============================================
  console.log('📦 Updating vendor financial data...');
  const { data: vendors } = await supabase
    .from('vendors')
    .select('id, name, total_annual_expense')
    .eq('organization_id', orgId)
    .is('deleted_at', null);

  if (vendors && vendors.length > 0) {
    const expenseDistribution = [500000, 250000, 180000, 120000, 75000, 50000, 35000, 25000, 15000, 10000];

    let updatedVendors = 0;
    for (let i = 0; i < vendors.length; i++) {
      const vendor = vendors[i];
      if (vendor.total_annual_expense === null) {
        const expense = expenseDistribution[i % expenseDistribution.length];
        await supabase
          .from('vendors')
          .update({
            total_annual_expense: expense,
            expense_currency: 'EUR',
            external_risk_score: Math.floor(Math.random() * 30) + 65,
            monitoring_enabled: i < 5,
            monitoring_domain: i < 5 ? `${vendor.name.toLowerCase().replace(/\s+/g, '')}.com` : null,
          })
          .eq('id', vendor.id);
        updatedVendors++;
      }
    }
    console.log(`  ✅ Updated ${updatedVendors} vendors with expense data`);
  } else {
    console.log('  ⚠️ No vendors found to update');
  }

  // ============================================
  // 2. Create/Update Incidents (for MTTR/MTTD)
  // ============================================
  console.log('\n🚨 Managing incident data...');
  const { data: incidents, count: incidentCount } = await supabase
    .from('incidents')
    .select('id, title, duration_hours, detection_datetime, occurrence_datetime', { count: 'exact' })
    .eq('organization_id', orgId);

  if (!incidents || incidents.length === 0) {
    console.log('  Creating sample incidents...');

    const sampleIncidents = [
      {
        title: 'Payment Gateway Timeout',
        description: 'Intermittent timeouts on payment processing service',
        status: 'resolved',
        classification: 'major',
        occurrence_datetime: randomDate(45),
        duration_hours: 4.5,
      },
      {
        title: 'Authentication Service Degradation',
        description: 'Slow login response times affecting 15% of users',
        status: 'resolved',
        classification: 'minor',
        occurrence_datetime: randomDate(30),
        duration_hours: 2.0,
      },
      {
        title: 'Database Failover Event',
        description: 'Planned failover caused brief service interruption',
        status: 'resolved',
        classification: 'minor',
        occurrence_datetime: randomDate(20),
        duration_hours: 0.5,
      },
      {
        title: 'API Rate Limit Breach',
        description: 'Third-party API exceeded rate limits causing partial outage',
        status: 'resolved',
        classification: 'minor',
        occurrence_datetime: randomDate(15),
        duration_hours: 1.5,
      },
      {
        title: 'Certificate Expiry Warning',
        description: 'SSL certificate approaching expiry on subdomain',
        status: 'resolved',
        classification: 'major',
        occurrence_datetime: randomDate(10),
        duration_hours: 8.0,
      },
    ];

    for (const incident of sampleIncidents) {
      const occurredDate = new Date(incident.occurrence_datetime);
      const detectionDelay = Math.floor(Math.random() * 90) + 15; // 15-105 minutes
      occurredDate.setMinutes(occurredDate.getMinutes() + detectionDelay);

      const { error } = await supabase.from('incidents').insert({
        organization_id: orgId,
        created_by: userId,
        ...incident,
        detection_datetime: occurredDate.toISOString(),
      });

      if (error) {
        console.log(`    ⚠️ Error creating incident: ${error.message}`);
      }
    }
    console.log(`  ✅ Created ${sampleIncidents.length} sample incidents`);
  } else {
    // Update existing incidents
    let updatedIncidents = 0;
    for (let i = 0; i < incidents.length; i++) {
      const incident = incidents[i];
      const updates: Record<string, unknown> = {};

      if (incident.duration_hours === null) {
        updates.duration_hours = [1.5, 2.0, 4.5, 8.0, 12.0, 24.0][i % 6];
      }
      if (incident.occurrence_datetime && !incident.detection_datetime) {
        const occurredDate = new Date(incident.occurrence_datetime);
        const detectionDelay = Math.floor(Math.random() * 105) + 15;
        occurredDate.setMinutes(occurredDate.getMinutes() + detectionDelay);
        updates.detection_datetime = occurredDate.toISOString();
      }

      if (Object.keys(updates).length > 0) {
        await supabase.from('incidents').update(updates).eq('id', incident.id);
        updatedIncidents++;
      }
    }
    console.log(`  ✅ Found ${incidentCount} incidents, updated ${updatedIncidents}`);
  }

  // ============================================
  // 3. Create/Update Resilience Tests and Findings
  // ============================================
  console.log('\n🧪 Managing resilience test data...');
  const { data: tests, count: testCount } = await supabase
    .from('resilience_tests')
    .select('id, test_type', { count: 'exact' })
    .eq('organization_id', orgId);

  if (!tests || tests.length === 0) {
    console.log('  Creating sample resilience tests...');

    const testTypes = [
      'vulnerability_assessment',
      'penetration_testing',
      'scenario_based',
      'disaster_recovery',
      'business_continuity',
      'tabletop_exercise',
      'backup_restoration',
    ];

    for (const testType of testTypes) {
      const { data: newTest, error } = await supabase
        .from('resilience_tests')
        .insert({
          organization_id: orgId,
          created_by: userId,
          test_type: testType,
          name: `${testType.replace(/_/g, ' ')} - Q4 2025`,
          description: `Annual ${testType.replace(/_/g, ' ')} test`,
          status: 'completed',
          planned_start_date: randomDateOnly(90),
          actual_end_date: randomDateOnly(60),
          tester_type: 'external',
          tester_certifications: ['CREST', 'OSCP'],
          tester_independence_verified: true,
          overall_result: 'pass',
        })
        .select('id')
        .single();

      if (error) {
        console.log(`    ⚠️ Error creating test: ${error.message}`);
      } else if (newTest) {
        // Create findings for each test
        const findingCount = Math.floor(Math.random() * 4) + 1;
        const severities = ['critical', 'high', 'medium', 'low'];

        for (let i = 0; i < findingCount; i++) {
          const severity = severities[i % 4];
          const cvssRanges: Record<string, [number, number]> = {
            critical: [9.0, 10.0],
            high: [7.0, 8.9],
            medium: [4.0, 6.9],
            low: [0.1, 3.9],
          };
          const range = cvssRanges[severity];
          const cvss = parseFloat((range[0] + Math.random() * (range[1] - range[0])).toFixed(1));

          await supabase.from('test_findings').insert({
            test_id: newTest.id,
            title: `Finding ${i + 1} - ${testType}`,
            description: `Security finding from ${testType} test`,
            severity,
            cvss_score: cvss,
            status: i === 0 ? 'closed' : i === 1 ? 'in_progress' : 'open',
          });
        }
      }
    }
    console.log(`  ✅ Created ${testTypes.length} resilience tests with findings`);
  } else {
    console.log(`  ✅ Found ${testCount} existing resilience tests`);

    // Update findings with CVSS scores
    const { data: findings } = await supabase
      .from('test_findings')
      .select('id, severity, cvss_score, test_id')
      .in('test_id', tests.map(t => t.id));

    if (findings && findings.length > 0) {
      let updatedFindings = 0;
      for (const finding of findings) {
        if (finding.cvss_score === null && finding.severity) {
          const cvssRanges: Record<string, [number, number]> = {
            critical: [9.0, 10.0],
            high: [7.0, 8.9],
            medium: [4.0, 6.9],
            low: [0.1, 3.9],
          };
          const range = cvssRanges[finding.severity] || [5.0, 5.9];
          const cvss = parseFloat((range[0] + Math.random() * (range[1] - range[0])).toFixed(1));

          await supabase.from('test_findings').update({ cvss_score: cvss }).eq('id', finding.id);
          updatedFindings++;
        }
      }
      if (updatedFindings > 0) {
        console.log(`  ✅ Updated ${updatedFindings} findings with CVSS scores`);
      }
    }
  }

  // ============================================
  // 4. Create TLPT Engagement
  // ============================================
  console.log('\n🎯 Managing TLPT engagement data...');
  const { data: tlptEngagements, count: tlptCount } = await supabase
    .from('tlpt_engagements')
    .select('id, status, next_tlpt_due', { count: 'exact' })
    .eq('organization_id', orgId);

  if (!tlptEngagements || tlptEngagements.length === 0) {
    console.log('  Creating sample TLPT engagement...');

    // Calculate next TLPT due (within 3-year cycle)
    const nextTlptDue = new Date();
    nextTlptDue.setFullYear(nextTlptDue.getFullYear() + 2); // 2 years from now

    const { error } = await supabase.from('tlpt_engagements').insert({
      organization_id: orgId,
      created_by: userId,
      name: 'TIBER-EU Red Team Exercise 2025',
      framework: 'TIBER-EU',
      status: 'planning',
      next_tlpt_due: nextTlptDue.toISOString().split('T')[0],
      regulator_notified: true,
    });

    if (error) {
      console.log(`    ⚠️ Error creating TLPT: ${error.message}`);
    } else {
      console.log('  ✅ Created TLPT engagement');
    }
  } else {
    console.log(`  ✅ Found ${tlptCount} TLPT engagements`);
  }

  // ============================================
  // 5. Create Incident Reports (for timeline compliance)
  // ============================================
  console.log('\n📋 Managing incident report data...');

  // Get incidents to link reports to
  const { data: allIncidents } = await supabase
    .from('incidents')
    .select('id, classification')
    .eq('organization_id', orgId);

  const { data: reports, count: reportCount } = await supabase
    .from('incident_reports')
    .select('id, incident_id', { count: 'exact' });

  if (allIncidents && allIncidents.length > 0) {
    const incidentsWithoutReports = allIncidents.filter(
      (inc) => !reports?.some((r) => r.incident_id === inc.id)
    );

    if (incidentsWithoutReports.length > 0) {
      console.log(`  Creating reports for ${incidentsWithoutReports.length} incidents...`);

      for (const incident of incidentsWithoutReports) {
        const reportDate = new Date();
        reportDate.setDate(reportDate.getDate() - Math.floor(Math.random() * 30));

        // Deadline: 4h for initial, 72h for intermediate
        const deadline = new Date(reportDate);
        if (incident.classification === 'major') {
          deadline.setHours(deadline.getHours() + 4);
        } else {
          deadline.setHours(deadline.getHours() + 72);
        }

        // Some submitted on time, some late
        const submitted = new Date(deadline);
        const variance = Math.random() > 0.7 ? 24 : -Math.floor(Math.random() * 48);
        submitted.setHours(submitted.getHours() + variance);

        const { error } = await supabase.from('incident_reports').insert({
          incident_id: incident.id,
          report_type: 'initial',
          status: 'submitted',
          submitted_at: submitted.toISOString(),
          submitted_by: userId,
          deadline: deadline.toISOString(),
          report_content: { summary: 'Incident report submitted' },
        });

        if (error) {
          console.log(`    ⚠️ Error creating report: ${error.message}`);
        }
      }
      console.log(`  ✅ Created ${incidentsWithoutReports.length} incident reports`);
    } else {
      console.log(`  ✅ All ${allIncidents.length} incidents have reports`);
    }
  } else if (reportCount && reportCount > 0) {
    console.log(`  ✅ Found ${reportCount} incident reports`);
  } else {
    console.log('  ⚠️ No incidents found to create reports for');
  }

  // ============================================
  // Summary
  // ============================================
  console.log('\n✨ Sample data population complete!');
  console.log('\nNext steps:');
  console.log('  1. Run `npx tsx scripts/test-snapshot.ts` to verify KPI calculations');
  console.log('  2. Check the compliance trends dashboard at /compliance/trends');
}

populateData().catch(console.error);
