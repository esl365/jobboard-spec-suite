#!/usr/bin/env node
/**
 * Scan prompts/ directory for completed prompt files
 * A prompt is considered completed if it has a "## DONE" section
 *
 * Output: JSON array of completed prompts with metadata
 */

import { readdir, readFile } from 'fs/promises';
import { join } from 'path';

const PROMPTS_DIR = 'prompts';
const DONE_MARKER = /^##\s+DONE\s*\(([^)]+)\)/m;
const PROMPT_FILE_PATTERN = /^P(\d+)-claude-(.+)\.md$/;

async function scanCompletedPrompts() {
  const completed = [];

  try {
    const files = await readdir(PROMPTS_DIR);

    for (const file of files) {
      const match = file.match(PROMPT_FILE_PATTERN);
      if (!match) continue;

      const [, number, description] = match;
      const filePath = join(PROMPTS_DIR, file);
      const content = await readFile(filePath, 'utf-8');

      // Check if the prompt has a DONE section
      const doneMatch = content.match(DONE_MARKER);
      if (doneMatch) {
        const completionDate = doneMatch[1];

        // Extract title from first heading
        const titleMatch = content.match(/^#\s+P\d+:\s*(.+)$/m);
        const title = titleMatch ? titleMatch[1] : description;

        // Extract summary from DONE section
        const summaryMatch = content.match(/##\s+DONE[^]*?\*\*Summary:\*\*\s*(.+?)(?:\n|$)/);
        const summary = summaryMatch ? summaryMatch[1].trim() : '';

        // Extract PR/commit evidence
        const evidenceMatch = content.match(/##\s+DONE[^]*?\*\*Evidence:\*\*([^]*?)(?:\n\*\*|\n##|$)/);
        const evidence = evidenceMatch ? evidenceMatch[1].trim() : '';

        completed.push({
          number: `P${number.padStart(4, '0')}`,
          title,
          description,
          file,
          completionDate,
          summary,
          evidence,
        });
      }
    }

    // Sort by prompt number
    completed.sort((a, b) => a.number.localeCompare(b.number));

  } catch (error) {
    if (error.code === 'ENOENT') {
      // prompts/ directory doesn't exist, return empty array
      return [];
    }
    throw error;
  }

  return completed;
}

// Run and output as JSON
const completed = await scanCompletedPrompts();
console.log(JSON.stringify(completed, null, 2));
