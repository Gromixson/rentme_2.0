#!/usr/bin/env node
/**
 * Mission Log status digest (M5L1) — read-only local checks, no secrets.
 * Usage: npm run status:digest [-- --write] [-- --skip-tests]
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PROJECT_ID } from './read-firebase-project.mjs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const writeOut = args.includes('--write');
const skipTests = args.includes('--skip-tests');

function read(rel) {
  const path = join(root, rel);
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function run(cmd, cmdArgs, opts = {}) {
  return spawnSync(cmd, cmdArgs, {
    cwd: root,
    encoding: 'utf8',
    shell: process.platform === 'win32',
    ...opts,
  });
}

function parseBlockers(backlog) {
  const match = backlog.match(/## Blockers[\s\S]*?(?=\n## |\n---\s*\n## |$)/);
  if (!match) return [];
  return [...match[0].matchAll(/^### (.+)$/gm)].map((m) => m[1].trim());
}

function parseInProgress(backlog) {
  const match = backlog.match(/## W toku[\s\S]*?(?=\n## |\n---\s*\n## |$)/);
  if (!match) return [];
  return [...match[0].matchAll(/^### (.+)$/gm)]
    .map((m) => m[1].trim())
    .filter((h) => !h.startsWith('`'));
}

function e2ePreflight() {
  const vars = [
    'E2E_SEEKER_EMAIL',
    'E2E_SEEKER_PASSWORD',
    'E2E_PROVIDER_EMAIL',
    'E2E_PROVIDER_PASSWORD',
  ];
  const present = vars.filter((v) => Boolean(process.env[v]));
  const seekerOk = Boolean(process.env.E2E_SEEKER_EMAIL && process.env.E2E_SEEKER_PASSWORD);
  const providerOk = Boolean(process.env.E2E_PROVIDER_EMAIL && process.env.E2E_PROVIDER_PASSWORD);
  return {
    varsSet: present.length,
    varsTotal: vars.length,
    seekerOk,
    providerOk,
    guestOnly: !seekerOk && !providerOk,
    roleGuardActive: seekerOk,
    acceptBookingActive: seekerOk && providerOk,
  };
}

function gitStatus() {
  const remote = run('git', ['remote', '-v']);
  const branch = run('git', ['branch', '--show-current']);
  const hasRemote = Boolean(remote.stdout?.trim());
  const gh = run('gh', ['--version']);
  return {
    hasRemote,
    remoteLines: remote.stdout?.trim().split('\n').filter(Boolean).slice(0, 2) ?? [],
    branch: branch.stdout?.trim() || 'unknown',
    ghAvailable: gh.status === 0,
  };
}

function manifestStatus() {
  try {
    const raw = read('.cursor/.10x-cli-manifest.json');
    if (!raw) return { lessonId: 'brak', lastApplied: 'brak' };
    const m = JSON.parse(raw);
    return { lessonId: m.lessonId ?? '?', lastApplied: (m.lastApplied ?? '').slice(0, 10) };
  } catch {
    return { lessonId: 'parse-error', lastApplied: '?' };
  }
}

function architectDecisionsPending() {
  const report = read('context/architect-report.md');
  return report.includes('[DO UZUPEŁNIENIA');
}

function functionsTestStatus() {
  if (skipTests) return { ran: false, ok: null, summary: 'pominięto (--skip-tests)' };
  const result = run('npm', ['run', 'functions:test'], { timeout: 120_000 });
  const out = `${result.stdout ?? ''}${result.stderr ?? ''}`;
  const passed = (out.match(/(\d+)\s+passed/g) ?? [])
    .map((s) => Number(s.match(/\d+/)[0]))
    .reduce((a, b) => a + b, 0);
  const failed = (out.match(/(\d+)\s+failed/g) ?? [])
    .map((s) => Number(s.match(/\d+/)[0]))
    .reduce((a, b) => a + b, 0);
  return {
    ran: true,
    ok: result.status === 0,
    summary: result.status === 0 ? `OK (${passed || '?'} passed)` : `FAIL (exit ${result.status})`,
  };
}

const now = new Date().toISOString().slice(0, 16).replace('T', ' ');
const backlog = read('context/foundation/pending-backlog.md');
const blockers = parseBlockers(backlog);
const inProgress = parseInProgress(backlog);
const e2e = e2ePreflight();
const git = gitStatus();
const manifest = manifestStatus();
const architectPending = architectDecisionsPending();
const fnTest = functionsTestStatus();

const lines = [
  '# Mission Log — status digest',
  '',
  `> Wygenerowano: ${now} · Projekt Firebase: \`${PROJECT_ID}\``,
  '',
  '## Blockers (z backlogu)',
  '',
  blockers.length
    ? blockers.map((b) => `- ${b}`).join('\n')
    : '- _(brak sekcji Blockers w backlogu)_',
  '',
  '## W toku (nagłówki)',
  '',
  inProgress.length ? inProgress.map((h) => `- ${h}`).join('\n') : '- _(brak)_',
  '',
  '## Szybkie checki',
  '',
  '| Check | Status |',
  '|-------|--------|',
  `| Functions test (\`npm run functions:test\`) | ${fnTest.summary} |`,
  `| E2E seeker creds | ${e2e.seekerOk ? '✓ ustawione' : '✗ brak'} |`,
  `| E2E provider creds | ${e2e.providerOk ? '✓ ustawione' : '✗ brak'} |`,
  `| E2E north star (\`accept-booking\`) | ${e2e.acceptBookingActive ? 'aktywny' : '**SKIP**'} |`,
  `| Git remote | ${git.hasRemote ? '✓' : '**brak**'} |`,
  `| GitHub CLI (\`gh\`) | ${git.ghAvailable ? '✓' : '✗ nie w PATH'} |`,
  `| Branch | \`${git.branch}\` |`,
  `| 10x manifest lessonId | \`${manifest.lessonId}\` (${manifest.lastApplied}) |`,
  `| Architect report §6 decyzje | ${architectPending ? '**PENDING** — uzupełnij w `architect-report.md`' : '✓ wypełnione'} |`,
  '',
  '## Sugerowane następne kroki',
  '',
];

const next = [];
if (!e2e.acceptBookingActive)
  next.push('Ustaw `E2E_*` env i uruchom `npm run e2e` (north star S-06).');
if (!git.hasRemote) next.push('Dodaj `git remote` + zainstaluj `gh` — patrz `pending-backlog.md`.');
if (manifest.lessonId === 'm1l4')
  next.push('Odblokuj `10x-cli auth` i `sync` — manifest utknął na m1l4.');
if (architectPending) next.push('Uzupełnij §6 w `context/architect-report.md` (odznaka M4).');
if (fnTest.ran && !fnTest.ok) next.push('Napraw failing tests: `npm run functions:test`.');
if (!next.length) next.push('Brak krytycznych flag — kontynuuj bieżący slice z backlogu.');

lines.push(...next.map((s) => `- ${s}`));
lines.push('');

const digest = lines.join('\n');
process.stdout.write(digest);

if (writeOut) {
  const outPath = join(root, 'context/champion/latest-digest.md');
  writeFileSync(outPath, digest, 'utf8');
  process.stderr.write(`\nZapisano: context/champion/latest-digest.md\n`);
}
