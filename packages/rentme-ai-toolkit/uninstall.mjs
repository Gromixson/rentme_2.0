#!/usr/bin/env node
/**
 * @rentme/ai-toolkit — uninstaller (tylko pliki z manifestu + sentinel w AGENTS.md).
 */
import { existsSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const PKG_NAME = '@rentme/ai-toolkit';
const SENTINEL_BEGIN = `<!-- BEGIN ${PKG_NAME} -->`;
const SENTINEL_END = `<!-- END ${PKG_NAME} -->`;

const PROFILES = {
  cursor: { manifestDir: '.cursor', manifestFile: '.rentme-ai-toolkit-manifest.json' },
  'claude-code': { manifestDir: '.claude', manifestFile: '.rentme-ai-toolkit-manifest.json' },
  codex: { manifestDir: '.agents', manifestFile: '.rentme-ai-toolkit-manifest.json' },
};

function parseArgs(argv) {
  const profileArg = argv.find((a) => a.startsWith('--profile='));
  const profile = profileArg?.split('=')[1] ?? process.env.TOOLKIT_PROFILE ?? 'cursor';
  const repoRootArg = argv.find((a) => a.startsWith('--root='));
  const repoRoot = repoRootArg ? resolve(repoRootArg.split('=')[1]) : process.cwd();
  return { profile, repoRoot };
}

function removeSentinelBlock(repoRoot) {
  const agentsPath = join(repoRoot, 'AGENTS.md');
  if (!existsSync(agentsPath)) return;

  let content = readFileSync(agentsPath, 'utf8');
  const beginIdx = content.indexOf(SENTINEL_BEGIN);
  const endIdx = content.indexOf(SENTINEL_END);

  if (beginIdx === -1 || endIdx === -1 || endIdx <= beginIdx) return;

  const before = content.slice(0, beginIdx);
  const after = content.slice(endIdx + SENTINEL_END.length);
  content = `${before}${after}`.replace(/\n{3,}/g, '\n\n');
  writeFileSync(agentsPath, content, 'utf8');
  console.log('✓ usunięto sentinel z AGENTS.md');
}

function pruneEmptyDirs(filePath, repoRoot) {
  let dir = dirname(filePath);
  while (dir.startsWith(repoRoot) && dir !== repoRoot) {
    try {
      const entries = existsSync(dir) ? readdirSync(dir) : [];
      if (entries.length > 0) break;
      rmSync(dir, { recursive: true, force: true });
      dir = dirname(dir);
    } catch {
      break;
    }
  }
}

function main() {
  const { profile, repoRoot } = parseArgs(process.argv);
  const profileConfig = PROFILES[profile];

  if (!profileConfig) {
    console.error(`Nieznany profil: ${profile}`);
    process.exit(1);
  }

  const manifestPath = join(repoRoot, profileConfig.manifestDir, profileConfig.manifestFile);

  if (!existsSync(manifestPath)) {
    console.warn(`Brak manifestu: ${manifestPath} — nic do usunięcia.`);
    removeSentinelBlock(repoRoot);
    process.exit(0);
  }

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const files = manifest.files ?? [];

  for (const relPath of [...files].reverse()) {
    const absPath = join(repoRoot, relPath);
    if (existsSync(absPath)) {
      rmSync(absPath, { recursive: true, force: true });
      console.log(`✓ usunięto: ${relPath}`);
      pruneEmptyDirs(absPath, repoRoot);
    }
  }

  removeSentinelBlock(repoRoot);
  rmSync(manifestPath, { force: true });
  console.log(`✓ usunięto manifest: ${manifestPath}`);
  console.log(`\n[@rentme/ai-toolkit] Deinstalacja zakończona (profil: ${profile}).`);
}

main();
