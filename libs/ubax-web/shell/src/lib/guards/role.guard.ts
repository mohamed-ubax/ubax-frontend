import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { type RouteAccess } from '@ubax-workspace/ubax-web-data-access/role-access';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const { roles, scope } = (route.data as Partial<RouteAccess>) ?? {};

  if (!roles?.length) return true;

  const user = authStore.user();

  if (!user || !roles.includes(user.mainRole)) {
    return router.createUrlTree(['/tableau-de-bord']);
  }

  if (scope && user.scope !== null && user.scope !== scope) {
    return router.createUrlTree(['/tableau-de-bord']);
  }

  return true;
};
