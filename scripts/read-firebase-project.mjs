import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const firebaserc = JSON.parse(readFileSync(join(root, '.firebaserc'), 'utf8'));

/** Active Firebase/GCP project from .firebaserc or env override. */
export const PROJECT_ID =
  process.env.GCLOUD_PROJECT || process.env.FIREBASE_PROJECT || firebaserc.projects?.default;

if (!PROJECT_ID) {
  throw new Error('Brak project ID w .firebaserc (projects.default).');
}
