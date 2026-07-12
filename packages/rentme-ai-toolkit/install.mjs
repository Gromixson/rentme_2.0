#!/usr/bin/env node
/**
 * @rentme/ai-toolkit — installer (copy mode, bez symlinków).
 * Profile: cursor | claude-code | codex
 */
import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PACKAGE_ROOT = __dirname;
const PKG_NAME = '@rentme/ai-toolkit';
const PKG_VERSION = JSON.parse(readFileSync(join(PACKAGE_ROOT, 'package.json'), 'utf8')).version;
const SENTINEL_BEGIN = `<!-- BEGIN ${PKG_NAME} -->`;
const SENTINEL_END = `<!-- END ${PKG_NAME} -->`;

/** @type {Record<string, { skillsDir: string; promptsDir: string; manifestDir: string; manifestFile: string }>} */
const PROFILES = {
  cursor: {
    skillsDir: '.cursor/skills',
    promptsDir: '.cursor/prompts',
    manifestDir: '.cursor',
    manifestFile: '.rentme-ai-toolkit-manifest.json',
  },
  'claude-code': {
    skillsDir: '.claude/skills',
    promptsDir: '.claude/prompts',
    manifestDir: '.claude',
    manifestFile: '.rentme-ai-toolkit-manifest.json',
  },
  codex: {
    skillsDir: '.agents/skills',
    promptsDir: '.agents/prompts',
    manifestDir: '.agents',
    manifestFile: '.rentme-ai-toolkit-manifest.json',
  },
};

const SKILLS = ['rentme-code-review'];
const PROMPTS = ['review-pr.md'];

function parseArgs(argv) {
  const profileArg = argv.find((a) => a.startsWith('--profile='));
  const profile = profileArg?.split('=')[1] ?? process.env.TOOLKIT_PROFILE ?? 'cursor';
  const repoRootArg = argv.find((a) => a.startsWith('--root='));
  const repoRoot = repoRootArg ? resolve(repoRootArg.split('=')[1]) : findRepoRoot(process.cwd());
  return { profile, repoRoot };
}

function findRepoRoot(startDir) {
  let dir = resolve(startDir);
  for (let i = 0; i < 12; i++) {
    if (existsSync(join(dir, 'package.json'))) {
      return dir;
    }
    const parent = dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  return resolve(startDir);
}

function copyDirRecursive(src, dest, manifestFiles, repoRoot) {
  mkdirSync(dest, { recursive: true });
  for (const entry of readdirSync(src, { withFileTypes: true })) {
    const srcPath = join(src, entry.name);
    const destPath = join(dest, entry.name);
    if (entry.isDirectory()) {
      copyDirRecursive(srcPath, destPath, manifestFiles, repoRoot);
    } else {
      cpSync(srcPath, destPath);
      manifestFiles.push(relative(repoRoot, destPath).replace(/\\/g, '/'));
    }
  }
}

function copyFile(src, dest, manifestFiles, repoRoot) {
  mkdirSync(dirname(dest), { recursive: true });
  cpSync(src, dest);
  manifestFiles.push(relative(repoRoot, dest).replace(/\\/g, '/'));
}

/**
 * Idempotentnie wstawia lub podmienia blok reguł między sentinelami w AGENTS.md.
 * @param {string} repoRoot
 * @param {string} rulesContent
 */
function applyRules(repoRoot, rulesContent) {
  const agentsPath = join(repoRoot, 'AGENTS.md');
  const block = `${SENTINEL_BEGIN}\n${rulesContent.trim()}\n${SENTINEL_END}`;
  let content = '';

  if (existsSync(agentsPath)) {
    content = readFileSync(agentsPath, 'utf8');
  } else {
    content = `# Repository Guidelines\n\n`;
  }

  const beginIdx = content.indexOf(SENTINEL_BEGIN);
  const endIdx = content.indexOf(SENTINEL_END);

  if (beginIdx !== -1 && endIdx !== -1 && endIdx > beginIdx) {
    const before = content.slice(0, beginIdx);
    const after = content.slice(endIdx + SENTINEL_END.length);
    content = `${before}${block}${after}`;
  } else {
    if (!content.endsWith('\n')) content += '\n';
    content += `\n${block}\n`;
  }

  writeFileSync(agentsPath, content, 'utf8');
  return relative(repoRoot, agentsPath).replace(/\\/g, '/');
}

/**
 * Stub — konsument z GitHub Packages potrzebuje .npmrc z tokenem read:packages.
 * @see packages/rentme-ai-toolkit/README.md
 */
function ensureGitHubPackagesAuth() {
  const hasNpmrc =
    existsSync(join(process.cwd(), '.npmrc')) ||
    existsSync(join(process.env.HOME ?? process.env.USERPROFILE ?? '', '.npmrc'));
  if (!hasNpmrc) {
    console.warn(
      '[@rentme/ai-toolkit] Uwaga: brak .npmrc — przy instalacji z GitHub Packages dodaj token read:packages (patrz README).',
    );
  }
}

function writeManifest(repoRoot, profile, manifestFiles, agentsMdPath) {
  const profileConfig = PROFILES[profile];
  const manifestPath = join(repoRoot, profileConfig.manifestDir, profileConfig.manifestFile);
  mkdirSync(dirname(manifestPath), { recursive: true });

  const manifest = {
    package: PKG_NAME,
    version: PKG_VERSION,
    profile,
    installedAt: new Date().toISOString(),
    agentsMd: agentsMdPath,
    files: [...new Set(manifestFiles)].sort(),
  };

  writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifestPath;
}

function main() {
  const { profile, repoRoot } = parseArgs(process.argv);

  if (!PROFILES[profile]) {
    console.error(`Nieznany profil: ${profile}. Dostępne: ${Object.keys(PROFILES).join(', ')}`);
    process.exit(1);
  }

  ensureGitHubPackagesAuth();

  const profileConfig = PROFILES[profile];
  const manifestFiles = [];

  for (const skillName of SKILLS) {
    const src = join(PACKAGE_ROOT, 'skills', skillName);
    const dest = join(repoRoot, profileConfig.skillsDir, skillName);
    if (!existsSync(src)) {
      console.error(`Brak skillu w paczce: ${src}`);
      process.exit(1);
    }
    copyDirRecursive(src, dest, manifestFiles, repoRoot);
    console.log(`✓ skill: ${relative(repoRoot, dest)}`);
  }

  for (const promptFile of PROMPTS) {
    const src = join(PACKAGE_ROOT, 'prompts', promptFile);
    const dest = join(repoRoot, profileConfig.promptsDir, promptFile);
    if (!existsSync(src)) {
      console.error(`Brak promptu w paczce: ${src}`);
      process.exit(1);
    }
    copyFile(src, dest, manifestFiles, repoRoot);
    console.log(`✓ prompt: ${relative(repoRoot, dest)}`);
  }

  const rulesPath = join(PACKAGE_ROOT, 'rules', 'team-rules.md');
  const rulesContent = readFileSync(rulesPath, 'utf8');
  const agentsMdPath = applyRules(repoRoot, rulesContent);
  console.log(`✓ reguły: sentinel w ${agentsMdPath}`);

  const manifestPath = writeManifest(repoRoot, profile, manifestFiles, agentsMdPath);
  console.log(`✓ manifest: ${relative(repoRoot, manifestPath)}`);
  console.log(`\n[@rentme/ai-toolkit] Instalacja zakończona (profil: ${profile}).`);
}

main();
