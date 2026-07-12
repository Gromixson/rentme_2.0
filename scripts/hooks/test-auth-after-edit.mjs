#!/usr/bin/env node
/**
 * Cursor afterFileEdit — scoped Karma for auth/role guards (R-07, test-plan §5 flow 3).
 * Runs only for src/app/core/auth/** edits; ~8s for one spec file locally.
 * Exit 2 = blocking error (lesson M3L3 convention).
 */
import { spawnSync } from 'node:child_process';
import { basename, resolve } from 'node:path';
import { readHookInput, getEditedFilePath } from './read-hook-input.mjs';

const AUTH_SEGMENT = 'src/app/core/auth/';

const payload = readHookInput();
const filePath = getEditedFilePath(payload);
if (!filePath) process.exit(0);

const normalized = filePath.replace(/\\/g, '/');
if (!normalized.includes(AUTH_SEGMENT)) process.exit(0);

/** @returns {string | null} ng test --include target */
function pickInclude() {
  if (normalized.endsWith('.spec.ts')) {
    const idx = normalized.indexOf(AUTH_SEGMENT);
    return normalized.slice(idx);
  }
  if (normalized.endsWith('.ts')) {
    const name = basename(normalized, '.ts');
    const specCandidate = normalized.replace(/\.ts$/, '.spec.ts');
    return specCandidate.includes(AUTH_SEGMENT) ? specCandidate : `${AUTH_SEGMENT}**/*.spec.ts`;
  }
  return null;
}

const include = pickInclude();
if (!include) process.exit(0);

const result = spawnSync(
  'npx',
  ['ng', 'test', '--no-watch', '--browsers=ChromeHeadless', `--include=${include}`],
  { stdio: 'inherit', shell: true, cwd: resolve(process.cwd()) },
);

if (result.error) {
  console.error('[hook:test-auth]', result.error.message);
  process.exit(2);
}
if (result.status !== 0) {
  console.error('[hook:test-auth] Tests failed for include:', include);
  process.exit(2);
}
