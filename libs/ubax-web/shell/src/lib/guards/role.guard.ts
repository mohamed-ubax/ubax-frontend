import { inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivateFn, Router } from '@angular/router';
import {
  AuthStore,
  Role,
  roleCanAccess,
} from '@ubax-workspace/ubax-web-data-access';

export const roleGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authStore = inject(AuthStore);
  const router = inject(Router);

  const allowedRoles = route.data['roles'] as readonly Role[] | undefined;
  if (!allowedRoles?.length) return true;

  const userRole = authStore.role();
  if (roleCanAccess(userRole, allowedRoles)) return true;

  return router.createUrlTree(['/tableau-de-bord']);
};
