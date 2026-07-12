import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { UserRole } from '../models';
import { AuthService } from './auth.service';
import { waitForAuthReady } from './auth-ready';

export function roleGuard(expected: UserRole): CanActivateFn {
  return async () => {
    const auth = inject(AuthService);
    const router = inject(Router);
    const ready = await waitForAuthReady(auth, router);
    if (ready !== true) {
      return ready;
    }
    if (!auth.profile()?.roles.includes(expected)) {
      return router.createUrlTree(['/']);
    }
    if (auth.activeRole() !== expected) {
      return router.createUrlTree([
        expected === 'PROVIDER' ? '/provider' : '/seeker',
      ]);
    }
    return true;
  };
}
