#!/usr/bin/env node
/**
 * Update Claude Inbox GitHub issue with completed prompts
 *
 * Usage: node scripts/update-inbox-issue.mjs <completed.json> <issue_number>
 *
 * Environment variables:
 * - GITHUB_TOKEN: GitHub API token (required)
 * - GITHUB_REPOSITORY: owner/repo format (optional, auto-detected in CI)
 */

import { readFile } from 'fs/promises';

const GITHUB_API = 'https://api.github.com';

async function updateInboxIssue(completedFile, issueNumber) {
  const token = process.env.GITHUB_TOKEN;
  if (!token) {
    throw new Error('GITHUB_TOKEN environment variable is required');
  }

  // Parse repository from GITHUB_REPOSITORY env var or use default
  const repoEnv = process.env.GITHUB_REPOSITORY || 'owner/repo';
  const [owner, repo] = repoEnv.split('/');

  // Read completed prompts
  const completed = JSON.parse(await readFile(completedFile, 'utf-8'));

  if (completed.length === 0) {
    console.log('No completed prompts to update');
    return;
  }

  // Fetch current issue content
  const issueUrl = `${GITHUB_API}/repos/${owner}/${repo}/issues/${issueNumber}`;
  const issueResponse = await fetch(issueUrl, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
    },
  });

  if (!issueResponse.ok) {
    throw new Error(`Failed to fetch issue: ${issueResponse.statusText}`);
  }

  const issue = await issueResponse.json();
  let body = issue.body || '';

  // Build the completed prompts section
  let completedSection = '\n\n## ✅ Completed Prompts\n\n';
  for (const prompt of completed) {
    completedSection += `- **${prompt.number}**: ${prompt.title}\n`;
    completedSection += `  - Completed: ${prompt.completionDate}\n`;
    if (prompt.summary) {
      completedSection += `  - Summary: ${prompt.summary}\n`;
    }
    if (prompt.evidence) {
      completedSection += `  - Evidence: ${prompt.evidence.split('\n').join(', ')}\n`;
    }
    completedSection += '\n';
  }

  // Update or append completed section
  const completedMarker = /##\s+✅\s+Completed Prompts/;
  if (completedMarker.test(body)) {
    // Replace existing section
    body = body.replace(
      /##\s+✅\s+Completed Prompts[^]*?(?=\n##|\n---|\n$|$)/,
      completedSection.trim()
    );
  } else {
    // Append new section
    body += completedSection;
  }

  // Update the issue
  const updateResponse = await fetch(issueUrl, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ body }),
  });

  if (!updateResponse.ok) {
    throw new Error(`Failed to update issue: ${updateResponse.statusText}`);
  }

  console.log(`✅ Updated Claude Inbox issue #${issueNumber}`);
  console.log(`   Added ${completed.length} completed prompt(s)`);
}

// Parse CLI args
const [completedFile, issueNumber] = process.argv.slice(2);

if (!completedFile || !issueNumber) {
  console.error('Usage: node update-inbox-issue.mjs <completed.json> <issue_number>');
  process.exit(1);
}

await updateInboxIssue(completedFile, issueNumber);
