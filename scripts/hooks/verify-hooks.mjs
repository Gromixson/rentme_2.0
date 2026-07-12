#!/usr/bin/env node
/**
 * Smoke-test Cursor hook scripts without the IDE.
 * Usage: npm run hooks:verify
 */
import { spawnSync } from 'node:child_process';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const node = process.execPath;

const cases = [
  {
    name: 'prettier (role.guard.ts)',
    script: 'scripts/hooks/prettier-after-edit.mjs',
    stdin: JSON.stringify({
      file_path: 'src/app/core/auth/role.guard.ts',
      hook_event_name: 'afterFileEdit',
    }),
  },
  {
    name: 'typecheck (role.guard.ts)',
    script: 'scripts/hooks/typecheck-after-edit.mjs',
    stdin: JSON.stringify({
      file_path: 'src/app/core/auth/role.guard.ts',
      hook_event_name: 'afterFileEdit',
    }),
  },
  {
    name: 'test-auth skip (unrelated file)',
    script: 'scripts/hooks/test-auth-after-edit.mjs',
    stdin: JSON.stringify({
      file_path: 'src/app/features/home/home.component.ts',
      hook_event_name: 'afterFileEdit',
    }),
  },
  {
    name: 'test-functions skip (unrelated file)',
    script: 'scripts/hooks/test-functions-after-edit.mjs',
    stdin: JSON.stringify({
      file_path: 'src/app/features/home/home.component.ts',
      hook_event_name: 'afterFileEdit',
    }),
  },
  {
    name: 'test-functions skip (*.test.ts)',
    script: 'scripts/hooks/test-functions-after-edit.mjs',
    stdin: JSON.stringify({
      file_path: 'functions/src/services/requests.test.ts',
      hook_event_name: 'afterFileEdit',
    }),
  },
];

let failed = 0;
for (const c of cases) {
  const result = spawnSync(node, [resolve(root, c.script)], {
    cwd: root,
    input: c.stdin,
    encoding: 'utf8',
  });
  const ok = result.status === 0;
  console.log(`${ok ? 'OK' : 'FAIL'}  ${c.name} (exit ${result.status ?? 'signal'})`);
  if (!ok) {
    failed++;
    if (result.stderr) process.stderr.write(result.stderr);
  }
}

console.log('\nTo test auth tests hook (slow ~8s):');
console.log(
  '  echo \'{"file_path":"src/app/core/auth/role.guard.spec.ts"}\' | node scripts/hooks/test-auth-after-edit.mjs',
);
console.log('\nTo test functions tests hook (~1–2s):');
console.log(
  '  echo \'{"file_path":"functions/src/services/requests.ts"}\' | node scripts/hooks/test-functions-after-edit.mjs',
);

process.exit(failed > 0 ? 1 : 0);
