import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import {
  AuthStore,
  currentBrowserPath,
  redirectBrowserToPortalLogin,
} from '@ubax-workspace/ubax-web-data-access';

export const authGuard: CanActivateFn = () => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  if (authStore.token()) return true;

  const returnTo = currentBrowserPath();

  if (redirectBrowserToPortalLogin(returnTo)) {
    return false;
  }

  return router.createUrlTree(['/connexion'], {
    queryParams: { redirect: returnTo },
  });
};
