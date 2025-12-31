const Anthropic = require('@anthropic-ai/sdk');
const fs = require('fs');
const path = require('path');

async function testPdfAnalysis() {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error('ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  // Read the test PDF
  const pdfPath = '/mnt/c/Users/Samsung/Documents/Projects/Compliance/compliance-app/test-documents/nordcloud-pdfs/01-MASTER-SERVICE-AGREEMENT.pdf';
  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  console.log('PDF size:', pdfBuffer.length, 'bytes');
  console.log('Base64 length:', pdfBase64.length);

  const client = new Anthropic({ apiKey });

  const prompt = `Analyze this PDF document for DORA Article 30 compliance.

Return a JSON object with this structure:
{
  "contract_type": "Master Service Agreement",
  "parties": [{"name": "...", "role": "provider"}, {"name": "...", "role": "customer"}],
  "effective_date": "YYYY-MM-DD",
  "expiry_date": "YYYY-MM-DD",
  "governing_law": "...",
  "article_30_2": {
    "service_description": {"status": "present|partial|missing", "confidence": 0.9, "excerpts": ["..."], "location": "Page X", "analysis": "..."},
    "data_locations": {"status": "...", "confidence": 0.9, "excerpts": [], "location": null, "analysis": null}
  },
  "article_30_3": {
    "sla_targets": {"status": "...", "confidence": 0.9, "excerpts": [], "location": null, "analysis": null}
  },
  "risk_flags": [],
  "compliance_gaps": [],
  "article_30_2_score": 75,
  "article_30_3_score": 60,
  "overall_score": 68,
  "confidence_score": 0.85,
  "page_count": 5,
  "word_count": 3000
}

Return ONLY the JSON, no other text.`;

  console.log('\nSending PDF to Claude...');

  try {
    const response = await client.messages.create({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 8192,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'document',
              source: {
                type: 'base64',
                media_type: 'application/pdf',
                data: pdfBase64,
              },
            },
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    });

    console.log('\n=== RESPONSE ===');
    console.log('Stop reason:', response.stop_reason);
    console.log('Usage:', response.usage);

    const textContent = response.content.find(c => c.type === 'text');
    if (textContent && textContent.type === 'text') {
      console.log('\n=== TEXT CONTENT (first 2000 chars) ===');
      console.log(textContent.text.slice(0, 2000));

      // Try to parse JSON
      const jsonMatch = textContent.text.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        console.log('\n=== PARSED JSON ===');
        try {
          const parsed = JSON.parse(jsonMatch[0]);
          console.log('contract_type:', parsed.contract_type);
          console.log('overall_score:', parsed.overall_score);
          console.log('article_30_2_score:', parsed.article_30_2_score);
          console.log('parties:', JSON.stringify(parsed.parties, null, 2));
          if (parsed.article_30_2) {
            console.log('article_30_2 keys:', Object.keys(parsed.article_30_2));
            console.log('service_description:', JSON.stringify(parsed.article_30_2.service_description, null, 2));
          }
        } catch (e) {
          console.error('JSON parse error:', e.message);
        }
      } else {
        console.log('No JSON found in response!');
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
    if (error.status) console.error('Status:', error.status);
  }
}

testPdfAnalysis();
