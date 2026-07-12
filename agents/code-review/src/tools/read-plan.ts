import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';

export type ReadPlanResult = {
  changeId: string;
  path: string;
  content: string;
};

/** Tool: readPlan — loads plan.md from each context/changes subfolder. */
export async function readPlan(repoRoot: string): Promise<ReadPlanResult[]> {
  const changesDir = join(repoRoot, 'context', 'changes');
  const entries = await readdir(changesDir, { withFileTypes: true });
  const results: ReadPlanResult[] = [];

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    const planPath = join(changesDir, entry.name, 'plan.md');
    try {
      const content = await readFile(planPath, 'utf8');
      results.push({ changeId: entry.name, path: planPath, content });
    } catch {
      // brak plan.md
    }
  }

  return results;
}
