#!/usr/bin/env node
/**
 * Gemini Spec Drift Analyzer
 *
 * PR의 코드 변경사항과 명세를 비교하여 불일치를 감지하고 분석합니다.
 *
 * Environment Variables:
 * - GEMINI_API_KEY: Google AI Studio API key (required)
 * - PR_NUMBER: Pull request number
 * - PR_TITLE: Pull request title
 */

import { readFile, writeFile } from 'fs/promises';
import { existsSync } from 'fs';

// Use Gemini 1.5 Flash via v1 API (stable)
// v1 API is more stable than v1beta
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent';

/**
 * Gemini API 호출
 */
async function callGemini(prompt) {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    throw new Error('GEMINI_API_KEY environment variable is required');
  }

  const response = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }],
      generationConfig: {
        temperature: 0.2,
        topK: 40,
        topP: 0.95,
        maxOutputTokens: 4096,
      },
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${error}`);
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

/**
 * Drift 결과 분석
 */
async function analyzeDrift() {
  const prNumber = process.env.PR_NUMBER || 'unknown';
  const prTitle = process.env.PR_TITLE || 'Unknown PR';

  console.log(`Analyzing Spec Drift for PR #${prNumber}: ${prTitle}`);

  // Drift 체크 결과 읽기
  if (!existsSync('drift-result.txt')) {
    console.log('No drift-result.txt found, skipping analysis');
    return;
  }

  const driftResult = await readFile('drift-result.txt', 'utf8');

  // Drift가 없으면 분석 불필요
  if (driftResult.includes('drift: 0')) {
    console.log('✅ No drift detected, no analysis needed');

    const result = {
      status: 'clean',
      comment: '✅ **Spec Drift: 0**\n\nAll code changes match the specification perfectly!'
    };

    await writeFile('drift-analysis.json', JSON.stringify(result, null, 2));
    return;
  }

  console.log('⚠️ Drift detected, analyzing with Gemini...');

  const prompt = `You are a Spec-First development expert.

A spec drift check has detected mismatches between specification and implementation.

PR #${prNumber}: ${prTitle}

Drift Check Result:
\`\`\`
${driftResult}
\`\`\`

Please analyze:
1. What are the specific mismatches?
2. Is this drift acceptable or should it be fixed?
3. If it should be fixed, provide clear guidance

Provide a concise analysis in Markdown format suitable for a PR comment.`;

  const analysis = await callGemini(prompt);

  console.log('Gemini drift analysis completed');

  const result = {
    status: 'drift_detected',
    comment: `## ⚠️ Spec Drift Analysis

${analysis}

---

*Analyzed by Gemini Spec Manager*`
  };

  await writeFile('drift-analysis.json', JSON.stringify(result, null, 2));

  console.log('✅ Drift analysis complete');
}

/**
 * Main
 */
async function main() {
  try {
    await analyzeDrift();
    process.exit(0);
  } catch (error) {
    console.error('❌ Drift analysis failed:', error.message);
    console.error(error.stack);

    // Fallback result
    const fallback = {
      status: 'error',
      comment: `## ⚠️ Drift Analysis Failed

An error occurred during Gemini analysis:
\`\`\`
${error.message}
\`\`\`

Please review drift manually.`
    };

    await writeFile('drift-analysis.json', JSON.stringify(fallback, null, 2));

    process.exit(1);
  }
}

main();
