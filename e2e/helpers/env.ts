export function hasSeekerCreds(): boolean {
  return !!(process.env.E2E_SEEKER_EMAIL && process.env.E2E_SEEKER_PASSWORD);
}

export function hasProviderCreds(): boolean {
  return !!(process.env.E2E_PROVIDER_EMAIL && process.env.E2E_PROVIDER_PASSWORD);
}

export function hasDualAccountCreds(): boolean {
  return hasSeekerCreds() && hasProviderCreds();
}

export function seekerCreds(): { email: string; password: string } {
  const email = process.env.E2E_SEEKER_EMAIL;
  const password = process.env.E2E_SEEKER_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing E2E_SEEKER_EMAIL / E2E_SEEKER_PASSWORD');
  }
  return { email, password };
}

export function providerCreds(): { email: string; password: string } {
  const email = process.env.E2E_PROVIDER_EMAIL;
  const password = process.env.E2E_PROVIDER_PASSWORD;
  if (!email || !password) {
    throw new Error('Missing E2E_PROVIDER_EMAIL / E2E_PROVIDER_PASSWORD');
  }
  return { email, password };
}
