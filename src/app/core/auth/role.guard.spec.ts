import { TestBed } from '@angular/core/testing';
import {
  ActivatedRouteSnapshot,
  provideRouter,
  Router,
  RouterStateSnapshot,
  UrlTree,
} from '@angular/router';
import { signal, WritableSignal } from '@angular/core';
import { roleGuard } from './role.guard';
import { AuthService } from './auth.service';
import { UserProfile, UserRole } from '../models';

function createAuthMock(): {
  service: AuthService;
  loading: WritableSignal<boolean>;
  user: WritableSignal<{ uid: string } | null>;
  profile: WritableSignal<UserProfile | null>;
} {
  const loading = signal(false);
  const user = signal<{ uid: string } | null>(null);
  const profile = signal<UserProfile | null>(null);
  const service = {
    loading: () => loading(),
    isLoggedIn: () => !!user(),
    profile: () => profile(),
    activeRole: () => profile()?.activeRole ?? 'SEEKER',
  } as unknown as AuthService;
  return { service, loading, user, profile };
}

function profile(activeRole: UserRole, roles: UserRole[] = ['SEEKER', 'PROVIDER']): UserProfile {
  return {
    uid: 'u1',
    email: 'a@b.c',
    name: 'Test',
    roles,
    activeRole,
  };
}

describe('roleGuard', () => {
  let router: Router;
  let authMock: ReturnType<typeof createAuthMock>;

  beforeEach(() => {
    authMock = createAuthMock();
    TestBed.configureTestingModule({
      providers: [provideRouter([]), { provide: AuthService, useValue: authMock.service }],
    });
    router = TestBed.inject(Router);
  });

  async function runGuard(expected: UserRole): Promise<true | UrlTree> {
    const route = {} as ActivatedRouteSnapshot;
    const state = { url: '/test' } as RouterStateSnapshot;
    return TestBed.runInInjectionContext(
      () => roleGuard(expected)(route, state),
    ) as Promise<true | UrlTree>;
  }

  it('allows access when activeRole matches expected', async () => {
    authMock.user.set({ uid: 'u1' });
    authMock.profile.set(profile('SEEKER'));
    const result = await runGuard('SEEKER');
    expect(result).toBe(true);
  });

  it('redirects to login when not logged in', async () => {
    const result = await runGuard('SEEKER');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/auth/login');
  });

  it('redirects home when user lacks expected role', async () => {
    authMock.user.set({ uid: 'u1' });
    authMock.profile.set(profile('SEEKER', ['SEEKER']));
    const result = await runGuard('PROVIDER');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toBe('/');
  });

  it('redirects toward expected role path when activeRole differs (SEEKER → PROVIDER route)', async () => {
    authMock.user.set({ uid: 'u1' });
    authMock.profile.set(profile('SEEKER'));
    const result = await runGuard('PROVIDER');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/provider');
  });

  it('redirects toward expected role path when activeRole differs (PROVIDER → SEEKER route)', async () => {
    authMock.user.set({ uid: 'u1' });
    authMock.profile.set(profile('PROVIDER'));
    const result = await runGuard('SEEKER');
    expect(result instanceof UrlTree).toBe(true);
    expect((result as UrlTree).toString()).toContain('/seeker');
  });
});
