import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as Role[] | undefined;
  if (!allowedRoles?.length) return true;

  const userRole = authStore.role();
  if (userRole && allowedRoles.includes(userRole)) return true;

  return router.createUrlTree(['/tableau-de-bord']);
};
