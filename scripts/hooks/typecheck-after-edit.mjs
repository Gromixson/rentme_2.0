#!/usr/bin/env node
/**
 * Cursor afterFileEdit — project typecheck after TS edits.
 * Full-project tsc (~3–4s locally); lefthook pre-commit repeats the same gates.
 * Exit 2 = blocking error (lesson M3L3 convention).
 */
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { readHookInput, getEditedFilePath } from './read-hook-input.mjs';

const payload = readHookInput();
const filePath = getEditedFilePath(payload);
if (!filePath) process.exit(0);

const normalized = filePath.replace(/\\/g, '/');

/** @returns {string | null} tsconfig path relative to repo root */
function pickTsConfig() {
  if (normalized.includes('functions/') && normalized.endsWith('.ts')) {
    return 'functions/tsconfig.json';
  }
  if (normalized.endsWith('.spec.ts')) {
    return 'tsconfig.spec.json';
  }
  if (normalized.startsWith('src/') && normalized.endsWith('.ts')) {
    return 'tsconfig.app.json';
  }
  return null;
}

const tsconfig = pickTsConfig();
if (!tsconfig) process.exit(0);

const result = spawnSync('npx', ['tsc', '-p', tsconfig, '--noEmit'], {
  stdio: 'inherit',
  shell: true,
  cwd: resolve(process.cwd()),
});

if (result.error) {
  console.error('[hook:typecheck]', result.error.message);
  process.exit(2);
}
if (result.status !== 0) {
  console.error('[hook:typecheck] Typecheck failed (' + tsconfig + ')');
  process.exit(2);
}
