// Test GLEIF API enrichment functions
// Run with: node scripts/test-gleif.mjs

const GLEIF_API_BASE = 'https://api.gleif.org/api/v1';

// Test LEIs - well-known companies
const TEST_LEIS = {
  microsoft: 'INR2EJN1ERAN0W5ZP974',  // Microsoft Corporation
  google: '5493006MHB84DD0ZWV18',      // Alphabet Inc (Google parent)
  aws: 'LQPL1RIXL0WJQHJQXE88',         // Amazon.com
};

async function fetchJSON(url) {
  const response = await fetch(url, {
    headers: { 'Accept': 'application/vnd.api+json' }
  });
  if (!response.ok) {
    if (response.status === 404) return null;
    throw new Error(`API error: ${response.status}`);
  }
  return response.json();
}

async function testLookupLEI(lei) {
  console.log(`\n--- Testing LEI: ${lei} ---`);

  // Level 1: Basic entity data
  console.log('Fetching Level 1 (entity data)...');
  const entityData = await fetchJSON(`${GLEIF_API_BASE}/lei-records/${lei}`);

  if (!entityData) {
    console.log('LEI not found');
    return null;
  }

  const entity = entityData.data.attributes.entity;
  const registration = entityData.data.attributes.registration;

  console.log('Entity:', entity.legalName.name);
  console.log('Country:', entity.legalAddress.country);
  console.log('Status:', registration.status);
  console.log('Jurisdiction:', entity.jurisdiction || 'N/A');
  console.log('Registered As:', entity.registeredAs || 'N/A');
  console.log('Entity Status:', entity.status || 'N/A');
  console.log('Next Renewal:', registration.nextRenewalDate || 'N/A');

  // Level 2: Direct Parent
  console.log('\nFetching Level 2 (direct parent)...');
  try {
    const directParent = await fetchJSON(`${GLEIF_API_BASE}/lei-records/${lei}/direct-parent`);
    if (directParent && directParent.data && directParent.data.length > 0) {
      const parentLei = directParent.data[0].relationships?.['related-entity']?.data?.id;
      console.log('Direct Parent LEI:', parentLei || 'Not reported');

      if (parentLei) {
        const parentData = await fetchJSON(`${GLEIF_API_BASE}/lei-records/${parentLei}`);
        if (parentData) {
          console.log('Direct Parent Name:', parentData.data.attributes.entity.legalName.name);
          console.log('Direct Parent Country:', parentData.data.attributes.entity.legalAddress.country);
        }
      }
    } else {
      console.log('No direct parent reported');
    }
  } catch (e) {
    console.log('Direct parent lookup failed:', e.message);
  }

  // Level 2: Ultimate Parent
  console.log('\nFetching Level 2 (ultimate parent)...');
  try {
    const ultimateParent = await fetchJSON(`${GLEIF_API_BASE}/lei-records/${lei}/ultimate-parent`);
    if (ultimateParent && ultimateParent.data && ultimateParent.data.length > 0) {
      const parentLei = ultimateParent.data[0].relationships?.['related-entity']?.data?.id;
      console.log('Ultimate Parent LEI:', parentLei || 'Not reported');

      if (parentLei) {
        const parentData = await fetchJSON(`${GLEIF_API_BASE}/lei-records/${parentLei}`);
        if (parentData) {
          console.log('Ultimate Parent Name:', parentData.data.attributes.entity.legalName.name);
          console.log('Ultimate Parent Country:', parentData.data.attributes.entity.legalAddress.country);
        }
      }
    } else {
      console.log('No ultimate parent reported (entity may be ultimate parent itself)');
    }
  } catch (e) {
    console.log('Ultimate parent lookup failed:', e.message);
  }

  return entityData;
}

async function runTests() {
  console.log('=== GLEIF API Enrichment Test ===\n');

  for (const [name, lei] of Object.entries(TEST_LEIS)) {
    console.log(`\n========== ${name.toUpperCase()} ==========`);
    try {
      await testLookupLEI(lei);
    } catch (e) {
      console.error(`Error testing ${name}:`, e.message);
    }
  }

  console.log('\n\n=== Test Complete ===');
}

runTests();
