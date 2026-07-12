/**
 * Enables Firestore API and creates (default) database using Firebase CLI login.
 * Requires: firebase login (same account as firebase login:list).
 */
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { OAuth2Client } from 'google-auth-library';

const PROJECT_ID = 'rentme-b5e34';
const LOCATION = 'eur3';
const CLIENT_ID =
  process.env.FIREBASE_CLIENT_ID ||
  '563584335869-fgrhgmd47bqnekij5i8b5pr03ho849e6.apps.googleusercontent.com';
const CLIENT_SECRET = process.env.FIREBASE_CLIENT_SECRET || 'j9iVZfS8kkCEFUPaAeJV0sAi';

const configPath = join(homedir(), '.config', 'configstore', 'firebase-tools.json');

function loadRefreshToken() {
  if (!existsSync(configPath)) {
    throw new Error('Brak firebase-tools.json. Uruchom: firebase login');
  }
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const refresh = cfg?.tokens?.refresh_token;
  if (!refresh) {
    throw new Error('Brak refresh_token. Uruchom ponownie: firebase login');
  }
  return refresh;
}

async function getAccessToken() {
  const client = new OAuth2Client(CLIENT_ID, CLIENT_SECRET);
  client.setCredentials({ refresh_token: loadRefreshToken() });
  const { token } = await client.getAccessToken();
  if (!token) {
    throw new Error('Nie udało się uzyskać access token.');
  }
  return token;
}

async function apiFetch(url, { method = 'GET', body } = {}, token) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  return { ok: res.ok, status: res.status, json };
}

async function enableFirestoreApi(token) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/firestore.googleapis.com:enable`;
  const res = await apiFetch(url, { method: 'POST' }, token);
  if (res.ok || res.status === 409) {
    console.log('Firestore API: enabled (or already enabled).');
    return;
  }
  throw new Error(`Enable API failed (${res.status}): ${JSON.stringify(res.json)}`);
}

async function createDatabase(token) {
  const url = `https://firestore.googleapis.com/v1/projects/${PROJECT_ID}/databases?databaseId=(default)`;
  const res = await apiFetch(
    url,
    {
      method: 'POST',
      body: {
        locationId: LOCATION,
        type: 'FIRESTORE_NATIVE',
      },
    },
    token,
  );
  if (res.ok) {
    console.log(`Database (default) created in ${LOCATION}.`);
    return;
  }
  const msg = JSON.stringify(res.json);
  if (res.status === 409 || msg.includes('ALREADY_EXISTS')) {
    console.log('Database (default) already exists.');
    return;
  }
  throw new Error(`Create database failed (${res.status}): ${msg}`);
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  const token = await getAccessToken();
  await enableFirestoreApi(token);
  console.log('Waiting 15s for API propagation...');
  await new Promise((r) => setTimeout(r, 15_000));
  await createDatabase(token);
  console.log('Done. Restart: npm run dev:api && npm start');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
