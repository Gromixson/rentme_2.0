#!/usr/bin/env node
/**
 * Cursor afterFileEdit — format the edited file with Prettier.
 * Exit 2 = blocking error (lesson M3L3 convention).
 */
import { spawnSync } from 'node:child_process';
import { extname, resolve } from 'node:path';
import { readHookInput, getEditedFilePath } from './read-hook-input.mjs';

const PRETTIER_EXTS = new Set([
  '.ts',
  '.html',
  '.scss',
  '.json',
  '.md',
  '.yml',
  '.yaml',
  '.mjs',
  '.js',
  '.css',
]);

const payload = readHookInput();
const filePath = getEditedFilePath(payload);
if (!filePath) process.exit(0);

const ext = extname(filePath);
if (!PRETTIER_EXTS.has(ext)) process.exit(0);

const abs = resolve(filePath);
const result = spawnSync('npx', ['prettier', '--write', abs], {
  stdio: 'inherit',
  shell: true,
  cwd: process.cwd(),
});

if (result.error) {
  console.error('[hook:prettier]', result.error.message);
  process.exit(2);
}
if (result.status !== 0) {
  console.error('[hook:prettier] Prettier failed for', abs);
  process.exit(2);
}
