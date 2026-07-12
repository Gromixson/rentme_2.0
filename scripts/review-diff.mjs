#!/usr/bin/env node
/**
 * Local helper: git diff against base → review agent (stdin pipe).
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..');

function parseArgs(argv) {
  const out = { base: 'master', title: '', body: '', withTools: false };
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--base' && argv[i + 1]) out.base = argv[++i];
    else if (a === '--title' && argv[i + 1]) out.title = argv[++i];
    else if (a === '--body' && argv[i + 1]) out.body = argv[++i];
    else if (a === '--with-tools') out.withTools = true;
  }
  return out;
}

function gitDiff(base) {
  const remoteRef = `origin/${base}`;
  if (
    spawnSync('git', ['rev-parse', remoteRef], { cwd: repoRoot, encoding: 'utf8' }).status === 0
  ) {
    return spawnSync('git', ['diff', `${remoteRef}...HEAD`], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
  }
  if (spawnSync('git', ['rev-parse', base], { cwd: repoRoot, encoding: 'utf8' }).status === 0) {
    return spawnSync('git', ['diff', `${base}...HEAD`], {
      cwd: repoRoot,
      encoding: 'utf8',
      maxBuffer: 20 * 1024 * 1024,
    });
  }
  console.error(`[review:diff] Brak ref ${base} / origin/${base} — fallback HEAD~1..HEAD`);
  return spawnSync('git', ['diff', 'HEAD~1', 'HEAD'], {
    cwd: repoRoot,
    encoding: 'utf8',
    maxBuffer: 20 * 1024 * 1024,
  });
}

const args = parseArgs(process.argv);
const script = join(
  repoRoot,
  'agents/code-review/dist',
  args.withTools ? 'review-with-tools.js' : 'review.js',
);

if (!existsSync(script)) {
  console.error('Brak dist/. Uruchom: npm run build --prefix agents/code-review');
  process.exit(1);
}

const diff = gitDiff(args.base);
if (diff.error) {
  console.error('[review:diff]', diff.error.message);
  process.exit(1);
}

const reviewArgs = ['--title', args.title || 'local review'];
if (args.body) reviewArgs.push('--body', args.body);

const result = spawnSync(process.execPath, [script, ...reviewArgs], {
  cwd: repoRoot,
  input: diff.stdout ?? '',
  encoding: 'utf8',
  stdio: ['pipe', 'inherit', 'inherit'],
  env: process.env,
});

process.exit(result.status ?? 1);
