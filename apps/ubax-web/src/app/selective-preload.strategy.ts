import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  private readonly authStore = inject(AuthStore);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload']) {
      return of(null);
    }

    const allowedRoles = route.data['roles'] as Role[] | undefined;
    const currentRole = this.authStore.role();

    if (
      allowedRoles?.length &&
      (!currentRole || !allowedRoles.includes(currentRole))
    ) {
      return of(null);
    }

    return load();
  }
}
