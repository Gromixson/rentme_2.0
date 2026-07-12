#!/usr/bin/env node
/**
 * Cursor afterFileEdit — scoped Vitest for Cloud Functions (test-plan §7, R-04).
 * Runs only for functions/src/** edits excluding *.test.ts; full suite ~1–2s locally.
 * Exit 2 = blocking error (lesson M3L3 convention).
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readHookInput, getEditedFilePath } from './read-hook-input.mjs';

const FUNCTIONS_SEGMENT = 'functions/src/';

const payload = readHookInput();
const filePath = getEditedFilePath(payload);
if (!filePath) process.exit(0);

const normalized = filePath.replace(/\\/g, '/');
if (!normalized.includes(FUNCTIONS_SEGMENT)) process.exit(0);
if (normalized.endsWith('.test.ts')) process.exit(0);

const result = spawnSync('npm', ['run', 'functions:test'], {
  stdio: 'inherit',
  shell: true,
  cwd: resolve(process.cwd()),
});

if (result.error) {
  console.error('[hook:test-functions]', result.error.message);
  process.exit(2);
}
if (result.status !== 0) {
  console.error('[hook:test-functions] Vitest failed after edit:', normalized);
  process.exit(2);
}
