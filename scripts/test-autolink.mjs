import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://oipwlrhyzayuxgcabsvu.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function testAutoLink() {
  // Get a parsed document with subservice orgs
  const { data: parsed, error: parsedError } = await supabase
    .from('parsed_soc2')
    .select('document_id, subservice_orgs')
    .not('subservice_orgs', 'is', null)
    .limit(1)
    .single();

  if (parsedError || !parsed) {
    console.error('No parsed documents found:', parsedError?.message);
    return;
  }

  console.log('Found parsed document:', parsed.document_id);
  console.log('Subservice orgs count:', Array.isArray(parsed.subservice_orgs) ? parsed.subservice_orgs.length : 0);

  // Get the document details
  const { data: doc } = await supabase
    .from('documents')
    .select('id, vendor_id, organization_id')
    .eq('id', parsed.document_id)
    .single();

  console.log('\nDocument details:', JSON.stringify(doc, null, 2));

  // Check existing subcontractors for this vendor
  if (doc?.vendor_id) {
    const { data: subs, count } = await supabase
      .from('subcontractors')
      .select('id, subcontractor_name, source_type', { count: 'exact' })
      .eq('vendor_id', doc.vendor_id)
      .is('deleted_at', null);

    console.log('\nExisting subcontractors for vendor:', count);
    if (subs) {
      subs.forEach(s => console.log('  - ' + s.subcontractor_name + ' (' + (s.source_type || 'manual') + ')'));
    }

    // Now test creating subcontractors from parsed data
    const orgs = parsed.subservice_orgs;
    console.log('\n=== Testing auto-link insertion ===');

    for (const org of orgs) {
      const name = org.name;
      const inclusionMethod = org.inclusionMethod || (org.carveOut ? 'carve_out' : 'inclusive');
      const hasOwnSoc2 = org.hasOwnSoc2 || false;
      const controlsSupported = org.controlsSupported || [];
      const serviceDescription = org.serviceDescription || '';

      console.log('\nProcessing:', name);

      // Check if exists
      const { data: existing } = await supabase
        .from('subcontractors')
        .select('id, subcontractor_name')
        .eq('vendor_id', doc.vendor_id)
        .ilike('subcontractor_name', name.trim())
        .is('deleted_at', null)
        .single();

      if (existing) {
        console.log('  Already exists:', existing.id);
      } else {
        // Insert new subcontractor
        const { data: newSub, error: insertError } = await supabase
          .from('subcontractors')
          .insert({
            vendor_id: doc.vendor_id,
            organization_id: doc.organization_id,
            subcontractor_name: name,
            tier_level: 1,
            service_description: serviceDescription,
            service_type: 'cloud_infrastructure',
            source_type: 'soc2_extraction',
            source_document_id: parsed.document_id,
            inclusion_method: inclusionMethod,
            controls_supported: controlsSupported,
            has_own_soc2: hasOwnSoc2,
            is_monitored: false,
          })
          .select('id')
          .single();

        if (insertError) {
          console.log('  Insert error:', insertError.message);
        } else {
          console.log('  Created:', newSub.id);
        }
      }
    }

    // Final count
    const { count: finalCount } = await supabase
      .from('subcontractors')
      .select('id', { count: 'exact', head: true })
      .eq('vendor_id', doc.vendor_id)
      .is('deleted_at', null);

    console.log('\nFinal subcontractor count:', finalCount);
  }
}

testAutoLink().catch(console.error);
