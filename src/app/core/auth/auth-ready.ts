import { Router, UrlTree } from '@angular/router';
import { AuthService } from './auth.service';

const LOADING_TIMEOUT_MS = 10_000;

/** Resolves when auth.loading() is false, or returns a UrlTree on timeout / guest redirect target. */
export function waitForAuthReady(
  auth: AuthService,
  router: Router,
  options?: { requireLoggedIn?: boolean },
): Promise<true | UrlTree> {
  const requireLoggedIn = options?.requireLoggedIn ?? true;
  const loginTree = router.createUrlTree(['/auth/login']);
  const homeTree = router.createUrlTree(['/']);

  const resolve = (): true | UrlTree => {
    if (requireLoggedIn) {
      return auth.isLoggedIn() ? true : loginTree;
    }
    return auth.isLoggedIn() ? homeTree : true;
  };

  if (!auth.loading()) {
    return Promise.resolve(resolve());
  }

  return new Promise((promiseResolve) => {
    const deadline = Date.now() + LOADING_TIMEOUT_MS;
    const check = () => {
      if (!auth.loading()) {
        promiseResolve(resolve());
        return;
      }
      if (Date.now() >= deadline) {
        promiseResolve(requireLoggedIn ? loginTree : homeTree);
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}
