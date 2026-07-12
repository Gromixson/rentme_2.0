/**
 * Creates App Engine app (required for Cloud Functions v2 upload bucket).
 * Uses Firebase CLI refresh token — run: firebase login
 */
import { readFileSync, existsSync } from 'fs';
import { homedir } from 'os';
import { join } from 'path';
import { OAuth2Client } from 'google-auth-library';

const PROJECT_ID = 'rentme-b5e34';
/** Matches Cloud Functions region europe-west1. */
const LOCATION_ID = 'europe-west';

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

async function enableApi(service, token) {
  const url = `https://serviceusage.googleapis.com/v1/projects/${PROJECT_ID}/services/${service}:enable`;
  const res = await apiFetch(url, { method: 'POST' }, token);
  if (res.ok || res.status === 409) {
    console.log(`${service}: enabled (or already).`);
    return;
  }
  throw new Error(`Enable ${service} failed (${res.status}): ${JSON.stringify(res.json)}`);
}

async function getApp(token) {
  const url = `https://appengine.googleapis.com/v1/apps/${PROJECT_ID}`;
  return apiFetch(url, {}, token);
}

async function createApp(token) {
  const existing = await getApp(token);
  if (existing.ok) {
    console.log(`App Engine already exists (location: ${existing.json.locationId ?? 'unknown'}).`);
    return;
  }

  const url = 'https://appengine.googleapis.com/v1/apps';
  const res = await apiFetch(
    url,
    {
      method: 'POST',
      body: { id: PROJECT_ID, locationId: LOCATION_ID },
    },
    token,
  );
  if (res.ok) {
    console.log(`App Engine create started (${LOCATION_ID}). Operation:`, res.json.name ?? res.json);
    return;
  }
  const msg = JSON.stringify(res.json);
  if (res.status === 409 || msg.includes('already exists')) {
    console.log('App Engine already exists.');
    return;
  }
  throw new Error(`Create App Engine failed (${res.status}): ${msg}`);
}

async function main() {
  console.log(`Project: ${PROJECT_ID}`);
  const token = await getAccessToken();
  await enableApi('appengine.googleapis.com', token);
  await enableApi('appengineflex.googleapis.com', token);
  await createApp(token);
  console.log('Done. Wait ~1 min, then: firebase deploy --only functions');
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
