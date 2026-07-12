import { readdir, readFile } from 'node:fs/promises';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runReview } from './review.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');

/** readPlan tool — plan.md files under context/changes subfolders. */
export async function loadPlanContext(repoRoot: string): Promise<string> {
  const changesDir = join(repoRoot, 'context', 'changes');
  const entries = await readdir(changesDir, { withFileTypes: true });
  const sections: string[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const planPath = join(changesDir, entry.name, 'plan.md');
    try {
      const content = await readFile(planPath, 'utf8');
      sections.push(`### ${entry.name}/plan.md\n${content.trim()}`);
    } catch {
      // brak plan.md
    }
  }

  if (sections.length === 0) return '';
  return `\n\n## Plany change (readPlan)\n\n${sections.join('\n\n---\n\n')}`;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function parseArgs(argv: string[]) {
  const args = { title: '', body: '', diffFile: '', json: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (arg === '--body' && argv[i + 1]) args.body = argv[++i];
    else if (arg === '--diff-file' && argv[i + 1]) args.diffFile = argv[++i];
    else if (arg === '--json') args.json = true;
  }
  return args;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const repoRoot = resolve(REPO_ROOT);
  const planContext = await loadPlanContext(repoRoot);

  let diff = '';
  if (args.diffFile) {
    diff = await readFile(args.diffFile, 'utf8');
  } else if (!process.stdin.isTTY) {
    diff = await readStdin();
  } else {
    console.error('Użycie: npm run review:diff -- --with-tools --title "feat: foo"');
    process.exit(1);
  }

  const output = await runReview({
    diff: diff.trim(),
    title: args.title,
    body: args.body,
    extraContext: planContext,
    logMetrics: true,
  });

  if (args.json) {
    console.log(JSON.stringify(output, null, 2));
  } else {
    console.log(output.summaryMarkdown);
    console.log(`\n---\n**Werdykt:** ${output.verdict.toUpperCase()} (z readPlan)`);
  }

  process.exit(output.verdict === 'pass' ? 0 : 1);
}

main().catch((err: unknown) => {
  console.error(`[code-review:tools] ${err instanceof Error ? err.message : String(err)}`);
  process.exit(2);
});
