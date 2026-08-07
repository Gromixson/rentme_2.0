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
        // Keep public auth screens reachable when Firebase Auth initialization hangs
        // (for example, a blocked persistence request in a browser). Protected
        // routes still fail closed by redirecting to login.
        promiseResolve(requireLoggedIn ? loginTree : true);
        return;
      }
      setTimeout(check, 50);
    };
    check();
  });
}
