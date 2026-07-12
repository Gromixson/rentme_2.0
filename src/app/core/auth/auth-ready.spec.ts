import { TestBed } from '@angular/core/testing';
import { provideRouter, Router, UrlTree } from '@angular/router';
import { signal } from '@angular/core';
import { waitForAuthReady } from './auth-ready';
import { AuthService } from './auth.service';

function mockAuth(overrides: {
  loading?: boolean;
  loggedIn?: boolean;
}): AuthService {
  const loading = signal(overrides.loading ?? false);
  const user = signal(overrides.loggedIn ? { uid: 'u1' } : null);
  return {
    loading: () => loading(),
    isLoggedIn: () => !!user(),
  } as unknown as AuthService;
}

describe('waitForAuthReady', () => {
  let router: Router;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideRouter([])],
    });
    router = TestBed.inject(Router);
  });

  it('allows access when logged in and not loading', async () => {
    const auth = mockAuth({ loading: false, loggedIn: true });
    const result = await waitForAuthReady(auth, router);
    expect(result).toBe(true);
  });

  it('redirects to login when not logged in', async () => {
    const auth = mockAuth({ loading: false, loggedIn: false });
    const result = await waitForAuthReady(auth, router);
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  it('resolves after loading finishes', async () => {
    const loading = signal(true);
    const user = signal<{ uid: string } | null>(null);
    const auth = {
      loading: () => loading(),
      isLoggedIn: () => !!user(),
    } as unknown as AuthService;

    setTimeout(() => {
      user.set({ uid: 'u1' });
      loading.set(false);
    }, 100);

    const result = await waitForAuthReady(auth, router);
    expect(result).toBe(true);
  });
});
