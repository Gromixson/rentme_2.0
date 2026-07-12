import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';
import { Output, stepCountIs, ToolLoopAgent } from 'ai';
import { REVIEW_SCHEMA, SYSTEM_PROMPT, type Review } from './common/review-schema.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = join(__dirname, '..', '..', '..');
const AGENTS_MD_PATH = join(REPO_ROOT, 'AGENTS.md');
const DEFAULT_MODEL = 'anthropic/claude-sonnet-4';

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

function buildInstructions(agentsMd: string): string {
  const agentsSection = agentsMd ? `\n\n## Konwencje projektu (AGENTS.md)\n\n${agentsMd}` : '';
  return `${SYSTEM_PROMPT}${agentsSection}`;
}

async function main(): Promise<void> {
  const apiKey = process.env.OPENROUTER_API_KEY?.trim();
  if (!apiKey) {
    console.error(
      'Błąd: brak OPENROUTER_API_KEY.\n' +
        'Ustaw klucz API OpenRouter w środowisku lub skopiuj agents/code-review/.env.example → .env\n' +
        'Dokumentacja: https://openrouter.ai/keys',
    );
    process.exit(1);
  }

  const diff = await readStdin();
  if (!diff) {
    console.error('Błąd: brak diffa na stdin. Przykład: git diff HEAD~1 | npm run review');
    process.exit(1);
  }

  const modelId = process.env.REVIEW_MODEL?.trim() || DEFAULT_MODEL;
  const openrouter = createOpenRouter({ apiKey });
  const agentsMd = loadAgentsMd();

  const agent = new ToolLoopAgent({
    model: openrouter(modelId),
    instructions: buildInstructions(agentsMd),
    tools: {},
    output: Output.object({ schema: REVIEW_SCHEMA }),
    stopWhen: stepCountIs(2),
  });

  try {
    const result = await agent.generate({
      prompt: `Przejrzyj poniższy git diff:\n\n\`\`\`diff\n${diff}\n\`\`\``,
      onStepFinish: ({ stepNumber, usage }) => {
        console.error(
          `[krok ${stepNumber}] tokeny: input=${usage.inputTokens ?? 0}, output=${usage.outputTokens ?? 0}, total=${usage.totalTokens ?? 0}`,
        );
      },
    });

    const totalUsage = result.totalUsage;
    if (totalUsage) {
      console.error(
        `[metryki] totalUsage: input=${totalUsage.inputTokens ?? 0}, output=${totalUsage.outputTokens ?? 0}, total=${totalUsage.totalTokens ?? 0}`,
      );
    }

    const output = result.output as Review | undefined;
    if (!output) {
      console.error('Błąd: agent nie zwrócił strukturyzowanej odpowiedzi.');
      process.exit(1);
    }

    process.stdout.write(`${JSON.stringify(output, null, 2)}\n`);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Błąd podczas review: ${message}`);
    process.exit(1);
  }
}

main();
