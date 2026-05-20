import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { UbaxRole, type User } from '@ubax-workspace/shared-data-access';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access/auth-store';

export interface AdminRouteAccess {
  roles?: readonly UbaxRole[];
}

function hasRequiredRole(
  user: User | null,
  roles: readonly UbaxRole[] | undefined,
): boolean {
  if (!roles?.length) {
    return true;
  }

  return Boolean(user && roles.includes(user.mainRole));
}

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const access = (route.data as AdminRouteAccess | undefined) ?? {};

  if (hasRequiredRole(authStore.user(), access.roles)) {
    return true;
  }

  return router.createUrlTree(['/tableau-de-bord']);
};
