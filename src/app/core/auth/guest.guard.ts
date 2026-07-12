import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { waitForAuthReady } from './auth-ready';

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  return waitForAuthReady(auth, router, { requireLoggedIn: false });
};
