#!/usr/bin/env node
/**
 * End-to-end test for Modal SOC 2 parsing
 *
 * Tests:
 * 1. Modal health endpoint
 * 2. Create extraction job
 * 3. Trigger Modal parsing
 * 4. Monitor job progress
 * 5. Verify parsed results
 */

import { createClient } from '@supabase/supabase-js';

// Load environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://oipwlrhyzayuxgcabsvu.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '${SUPABASE_SERVICE_ROLE_KEY:-MISSING_ENV_VAR}';
const MODAL_PARSE_URL = process.env.MODAL_PARSE_SOC2_URL || 'https://federicots--dora-comply-soc2-parser-parse-soc2.modal.run';
const MODAL_HEALTH_URL = 'https://federicots--dora-comply-soc2-parser-health.modal.run';

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// Test results
const results = {
  timestamp: new Date().toISOString(),
  tests: [],
  summary: { passed: 0, failed: 0 }
};

function logTest(name, passed, details = {}) {
  const result = { name, passed, ...details };
  results.tests.push(result);
  if (passed) {
    results.summary.passed++;
    console.log(`✅ ${name}`);
  } else {
    results.summary.failed++;
    console.log(`❌ ${name}: ${details.error || 'Failed'}`);
  }
  if (details.data) {
    console.log(`   Data: ${JSON.stringify(details.data).slice(0, 200)}...`);
  }
}

async function testModalHealth() {
  console.log('\n📡 Testing Modal Health Endpoint...');
  try {
    const response = await fetch(MODAL_HEALTH_URL);
    const data = await response.json();

    if (data.status === 'healthy') {
      logTest('Modal Health Check', true, { data });
      return true;
    } else {
      logTest('Modal Health Check', false, { error: 'Unhealthy status', data });
      return false;
    }
  } catch (error) {
    logTest('Modal Health Check', false, { error: error.message });
    return false;
  }
}

async function findUnparsedDocument() {
  console.log('\n📄 Finding unparsed SOC 2 document...');
  try {
    // Find a SOC 2 document that hasn't been parsed
    const { data: documents, error } = await supabase
      .from('documents')
      .select('id, filename, storage_path, organization_id, vendor_id')
      .eq('type', 'soc2')
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) throw error;

    // Check which ones are not parsed
    for (const doc of documents) {
      const { data: parsed } = await supabase
        .from('parsed_soc2')
        .select('id')
        .eq('document_id', doc.id)
        .single();

      if (!parsed) {
        logTest('Find Unparsed Document', true, { data: { id: doc.id, filename: doc.filename } });
        return doc;
      }
    }

    // All documents are parsed, return the most recent one for re-testing
    logTest('Find Unparsed Document', true, {
      data: { id: documents[0].id, filename: documents[0].filename, note: 'Using already parsed doc' }
    });
    return documents[0];
  } catch (error) {
    logTest('Find Unparsed Document', false, { error: error.message });
    return null;
  }
}

async function createExtractionJob(document) {
  console.log('\n📝 Creating extraction job...');
  try {
    const { data: job, error } = await supabase
      .from('extraction_jobs')
      .insert({
        document_id: document.id,
        organization_id: document.organization_id,
        status: 'pending',
        progress_percentage: 0,
        current_phase: 'initializing',
        current_message: 'Test job - starting Modal parsing',
      })
      .select('id')
      .single();

    if (error) throw error;

    logTest('Create Extraction Job', true, { data: { job_id: job.id } });
    return job.id;
  } catch (error) {
    logTest('Create Extraction Job', false, { error: error.message });
    return null;
  }
}

async function triggerModalParsing(document, jobId) {
  console.log('\n🚀 Triggering Modal parsing...');
  try {
    const response = await fetch(MODAL_PARSE_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        document_id: document.id,
        job_id: jobId,
        organization_id: document.organization_id,
      }),
    });

    const data = await response.json();

    if (data.success) {
      logTest('Trigger Modal Parsing', true, { data });
      return true;
    } else {
      logTest('Trigger Modal Parsing', false, { error: data.error || 'Failed', data });
      return false;
    }
  } catch (error) {
    logTest('Trigger Modal Parsing', false, { error: error.message });
    return false;
  }
}

async function monitorJobProgress(jobId, maxWaitSeconds = 120) {
  console.log('\n⏳ Monitoring job progress...');
  const startTime = Date.now();
  let lastStatus = '';
  let lastProgress = 0;

  while ((Date.now() - startTime) < maxWaitSeconds * 1000) {
    try {
      const { data: job, error } = await supabase
        .from('extraction_jobs')
        .select('*')
        .eq('id', jobId)
        .single();

      if (error) throw error;

      // Log progress changes
      if (job.status !== lastStatus || job.progress_percentage !== lastProgress) {
        console.log(`   [${job.status}] ${job.progress_percentage}% - ${job.current_message || job.current_phase}`);
        lastStatus = job.status;
        lastProgress = job.progress_percentage;
      }

      // Check if complete or failed
      if (job.status === 'complete') {
        logTest('Job Completion', true, {
          data: {
            status: job.status,
            progress: job.progress_percentage,
            parsed_soc2_id: job.parsed_soc2_id,
            extracted_controls: job.extracted_controls,
            duration_ms: Date.now() - startTime
          }
        });
        return job;
      }

      if (job.status === 'failed') {
        logTest('Job Completion', false, {
          error: job.error_message,
          data: { status: job.status, message: job.current_message }
        });
        return job;
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, 3000));
    } catch (error) {
      console.log(`   Error checking job: ${error.message}`);
    }
  }

  logTest('Job Completion', false, { error: `Timeout after ${maxWaitSeconds}s` });
  return null;
}

async function verifyParsedResults(documentId) {
  console.log('\n🔍 Verifying parsed results...');
  try {
    const { data: parsed, error } = await supabase
      .from('parsed_soc2')
      .select('*')
      .eq('document_id', documentId)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error) throw error;

    const controlCount = parsed.controls?.length || 0;
    const exceptionCount = parsed.exceptions?.length || 0;

    logTest('Verify Parsed Results', true, {
      data: {
        report_type: parsed.report_type,
        audit_firm: parsed.audit_firm,
        opinion: parsed.opinion,
        controls: controlCount,
        exceptions: exceptionCount,
        period: `${parsed.period_start} to ${parsed.period_end}`
      }
    });

    return parsed;
  } catch (error) {
    logTest('Verify Parsed Results', false, { error: error.message });
    return null;
  }
}

async function verifyEvidenceLocations(documentId) {
  console.log('\n📍 Verifying evidence locations...');
  try {
    const { data: locations, error } = await supabase
      .from('evidence_locations')
      .select('*')
      .eq('source_document_id', documentId)
      .limit(10);

    if (error) throw error;

    if (locations && locations.length > 0) {
      logTest('Verify Evidence Locations', true, {
        data: {
          count: locations.length,
          sample: locations.slice(0, 3).map(l => ({
            type: l.evidence_type,
            id: l.evidence_id,
            page: l.page_number,
            confidence: l.confidence
          }))
        }
      });
    } else {
      logTest('Verify Evidence Locations', false, {
        error: 'No evidence locations created',
        data: { count: 0 }
      });
    }

    return locations;
  } catch (error) {
    logTest('Verify Evidence Locations', false, { error: error.message });
    return null;
  }
}

async function runTests() {
  console.log('🧪 Modal SOC 2 Parsing End-to-End Test');
  console.log('=====================================');
  console.log(`Timestamp: ${results.timestamp}`);
  console.log(`Modal URL: ${MODAL_PARSE_URL}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Test 1: Modal Health
  const healthOk = await testModalHealth();
  if (!healthOk) {
    console.log('\n⚠️  Modal health check failed. Aborting further tests.');
    return results;
  }

  // Test 2: Find document
  const document = await findUnparsedDocument();
  if (!document) {
    console.log('\n⚠️  No SOC 2 documents found. Aborting further tests.');
    return results;
  }

  // Test 3: Create job
  const jobId = await createExtractionJob(document);
  if (!jobId) {
    console.log('\n⚠️  Failed to create extraction job. Aborting further tests.');
    return results;
  }

  // Test 4: Trigger Modal
  const triggered = await triggerModalParsing(document, jobId);
  if (!triggered) {
    console.log('\n⚠️  Failed to trigger Modal parsing. Check Modal logs.');
    return results;
  }

  // Test 5: Monitor progress
  const completedJob = await monitorJobProgress(jobId, 180); // 3 minute timeout

  // Test 6: Verify parsed results
  if (completedJob?.status === 'complete') {
    await verifyParsedResults(document.id);
    await verifyEvidenceLocations(document.id);
  }

  // Print summary
  console.log('\n=====================================');
  console.log('📊 Test Summary');
  console.log('=====================================');
  console.log(`Total Tests: ${results.tests.length}`);
  console.log(`Passed: ${results.summary.passed} ✅`);
  console.log(`Failed: ${results.summary.failed} ❌`);
  console.log(`Success Rate: ${Math.round((results.summary.passed / results.tests.length) * 100)}%`);

  return results;
}

// Run tests
runTests().then(results => {
  console.log('\n📋 Full Results JSON:');
  console.log(JSON.stringify(results, null, 2));
  process.exit(results.summary.failed > 0 ? 1 : 0);
}).catch(error => {
  console.error('Test runner error:', error);
  process.exit(1);
});
