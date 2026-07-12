import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Output, stepCountIs, ToolLoopAgent } from 'ai';
import {
  CRITERIA_LABELS,
  deriveVerdict,
  REVIEW_SCHEMA,
  SYSTEM_PROMPT,
  type Review,
} from './common/review-schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const AGENTS_MD_PATH = join(REPO_ROOT, 'AGENTS.md');
const DEFAULT_MODEL = 'anthropic/claude-3.5-sonnet';

export function resolveApiKey(): string {
  const key = process.env.OPENROUTER_API_KEY?.trim() ?? process.env.LLM_PROVIDER_API_KEY?.trim();
  if (!key) {
    throw new Error(
      'Brak klucza API. Ustaw OPENROUTER_API_KEY lub LLM_PROVIDER_API_KEY (OpenRouter).\n' +
        'Lokalnie: skopiuj agents/code-review/.env.example → .env lub export w shell.\n' +
        'GHA: Settings → Secrets → OPENROUTER_API_KEY',
    );
  }
  return key;
}

async function readStdin(): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of process.stdin) {
    chunks.push(Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8').trim();
}

function loadAgentsMd(): string {
  try {
    return readFileSync(AGENTS_MD_PATH, 'utf8');
  } catch {
    console.error(`Ostrzeżenie: nie znaleziono AGENTS.md pod ${AGENTS_MD_PATH}`);
    return '';
  }
}

function buildInstructions(agentsMd: string, extraContext = ''): string {
  const agentsSection = agentsMd ? `\n\n## Konwencje projektu (AGENTS.md)\n\n${agentsMd}` : '';
  return `${SYSTEM_PROMPT}${agentsSection}${extraContext}`;
}

function parseArgs(argv: string[]) {
  const args = { title: '', body: '', diffFile: '', model: '', json: false };
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--title' && argv[i + 1]) args.title = argv[++i];
    else if (arg === '--body' && argv[i + 1]) args.body = argv[++i];
    else if (arg === '--diff-file' && argv[i + 1]) args.diffFile = argv[++i];
    else if (arg === '--model' && argv[i + 1]) args.model = argv[++i];
    else if (arg === '--json') args.json = true;
  }
  return args;
}

function buildPrompt(opts: { diff: string; title: string; body: string }): string {
  const title = opts.title || process.env.PR_TITLE || '(brak tytułu)';
  const body = opts.body || process.env.PR_BODY || '';
  const bodySection = body.trim()
    ? `\n\n## Opis PR\n${body.trim()}`
    : '\n\n## Opis PR\n(brak — oceniaj wyłącznie diff)';

  return `## Tytuł PR
${title}${bodySection}

Przejrzyj poniższy git diff:

\`\`\`diff
${opts.diff}
\`\`\``;
}

export async function runReview(opts: {
  diff: string;
  title?: string;
  body?: string;
  model?: string;
  extraContext?: string;
  logMetrics?: boolean;
}): Promise<Review> {
  const apiKey = resolveApiKey();
  const modelId = opts.model?.trim() || process.env.REVIEW_MODEL?.trim() || DEFAULT_MODEL;
  const openrouter = createOpenRouter({ apiKey });
  const agentsMd = loadAgentsMd();

  const agent = new ToolLoopAgent({
    model: openrouter(modelId),
    instructions: buildInstructions(agentsMd, opts.extraContext ?? ''),
    tools: {},
    output: Output.object({ schema: REVIEW_SCHEMA }),
    stopWhen: stepCountIs(2),
  });

  const result = await agent.generate({
    prompt: buildPrompt({
      diff: opts.diff,
      title: opts.title ?? '',
      body: opts.body ?? '',
    }),
    onStepFinish: opts.logMetrics
      ? ({ stepNumber, usage }) => {
          console.error(
            `[krok ${stepNumber}] tokeny: input=${usage.inputTokens ?? 0}, output=${usage.outputTokens ?? 0}`,
          );
        }
      : undefined,
  });

  if (opts.logMetrics && result.totalUsage) {
    const u = result.totalUsage;
    console.error(
      `[metryki] total: input=${u.inputTokens ?? 0}, output=${u.outputTokens ?? 0}, total=${u.totalTokens ?? 0}`,
    );
  }

  const output = result.output as Review | undefined;
  if (!output) {
    throw new Error('Agent nie zwrócił strukturyzowanej odpowiedzi.');
  }

  const derived = deriveVerdict(output.scores);
  return output.verdict === derived ? output : { ...output, verdict: derived };
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  let diff = '';

  if (args.diffFile) {
    diff = readFileSync(args.diffFile, 'utf8').trim();
  } else if (!process.stdin.isTTY) {
    diff = await readStdin();
  } else {
    console.error(
      'Użycie: git diff master...HEAD | npm run review --prefix agents/code-review -- --title "feat: foo"\n' +
        '   lub: node dist/review.js --diff-file changes.diff --title "..." [--json]',
    );
    process.exit(1);
  }

  if (!diff) {
    console.error('Błąd: pusty diff.');
    process.exit(1);
  }

  try {
    const output = await runReview({
      diff,
      title: args.title,
      body: args.body,
      model: args.model || undefined,
      logMetrics: true,
    });

    if (args.json) {
      process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
    } else {
      process.stdout.write(
        `${output.summaryMarkdown}\n\n---\n**Werdykt:** ${output.verdict.toUpperCase()}\n`,
      );
      const scores = Object.entries(output.scores)
        .map(([k, v]) => `- ${CRITERIA_LABELS[k as keyof typeof CRITERIA_LABELS]}: ${v}/10`)
        .join('\n');
      process.stdout.write(`\n${scores}\n`);
    }

    process.exit(output.verdict === 'pass' ? 0 : 1);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`[code-review] ${message}`);
    process.exit(2);
  }
}

main();
