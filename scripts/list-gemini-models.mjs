#!/usr/bin/env node
/**
 * List Available Gemini Models
 *
 * Calls the Gemini API to list all available models
 * to find the correct model name to use.
 *
 * Usage:
 *   GEMINI_API_KEY=your_key node scripts/list-gemini-models.mjs
 */

const apiKey = process.env.GEMINI_API_KEY;

if (!apiKey) {
  console.error('❌ GEMINI_API_KEY environment variable is required');
  console.error('Usage: GEMINI_API_KEY=your_key node scripts/list-gemini-models.mjs');
  process.exit(1);
}

async function listModels() {
  console.log('🔍 Fetching available Gemini models...\n');

  try {
    // Try v1 API
    console.log('Trying v1 API...');
    const v1Response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`
    );

    if (v1Response.ok) {
      const v1Data = await v1Response.json();
      console.log('✅ v1 API - Available models:');
      console.log(JSON.stringify(v1Data, null, 2));

      if (v1Data.models) {
        console.log('\n📋 Model Names (v1):');
        v1Data.models.forEach(model => {
          const supportsGenerateContent = model.supportedGenerationMethods?.includes('generateContent');
          console.log(`  ${supportsGenerateContent ? '✅' : '❌'} ${model.name}`);
        });
      }
    } else {
      console.log('❌ v1 API failed:', v1Response.status, await v1Response.text());
    }

    // Try v1beta API
    console.log('\n\nTrying v1beta API...');
    const v1betaResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (v1betaResponse.ok) {
      const v1betaData = await v1betaResponse.json();
      console.log('✅ v1beta API - Available models:');
      console.log(JSON.stringify(v1betaData, null, 2));

      if (v1betaData.models) {
        console.log('\n📋 Model Names (v1beta):');
        v1betaData.models.forEach(model => {
          const supportsGenerateContent = model.supportedGenerationMethods?.includes('generateContent');
          console.log(`  ${supportsGenerateContent ? '✅' : '❌'} ${model.name}`);
        });
      }
    } else {
      console.log('❌ v1beta API failed:', v1betaResponse.status, await v1betaResponse.text());
    }

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

listModels();
