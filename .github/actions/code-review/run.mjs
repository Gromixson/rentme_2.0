#!/usr/bin/env node
/**
 * Wrapper for GHA composite action — reads diff from env, writes verdict to GITHUB_OUTPUT.
 */
import { spawnSync } from 'node:child_process';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(__dirname, '..', '..', '..');
const agentRoot = join(repoRoot, 'agents', 'code-review');
const reviewScript = join(agentRoot, 'dist', 'review.js');

const diff = process.env.INPUT_DIFF ?? '';
const prTitle = process.env.INPUT_PR_TITLE ?? '';
const prBody = process.env.INPUT_PR_BODY ?? '';
const apiKey = process.env.INPUT_API_KEY ?? process.env.OPENROUTER_API_KEY ?? '';

if (!apiKey) {
  console.error('Brak INPUT_API_KEY / OPENROUTER_API_KEY');
  process.exit(2);
}

process.env.OPENROUTER_API_KEY = apiKey;
process.env.PR_TITLE = prTitle;
process.env.PR_BODY = prBody;

const tmpDir = join(agentRoot, '.tmp');
mkdirSync(tmpDir, { recursive: true });
const diffPath = join(tmpDir, 'pr.diff');
writeFileSync(diffPath, diff, 'utf8');

const result = spawnSync(
  process.execPath,
  [reviewScript, '--diff-file', diffPath, '--title', prTitle, '--json'],
  {
    cwd: repoRoot,
    encoding: 'utf8',
    env: process.env,
  },
);

if (result.stdout) process.stdout.write(result.stdout);
if (result.stderr) process.stderr.write(result.stderr);

let verdict = 'fail';
try {
  const parsed = JSON.parse(result.stdout);
  verdict = parsed.verdict === 'pass' ? 'pass' : 'fail';
  writeFileSync(join(tmpDir, 'review-result.json'), JSON.stringify(parsed, null, 2));
} catch {
  console.error('Nie udało się sparsować wyniku review jako JSON');
}

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  appendFileSync(githubOutput, `verdict=${verdict}\n`);
}

process.exit(result.status ?? 1);
