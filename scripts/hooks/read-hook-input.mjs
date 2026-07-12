import { readFileSync } from 'node:fs';

/** @returns {Record<string, unknown> | null} */
export function readHookInput() {
  const raw = readFileSync(0, 'utf8');
  if (!raw.trim()) return null;
  return JSON.parse(raw);
}

/** Cursor afterFileEdit payload uses `file_path` (relative or absolute). */
export function getEditedFilePath(payload) {
  if (!payload || typeof payload !== 'object') return null;
  const path =
    /** @type {string | undefined} */ (payload.file_path) ??
    /** @type {string | undefined} */ (payload.filePath) ??
    /** @type {string | undefined} */ (payload.path);
  return path ?? null;
}
