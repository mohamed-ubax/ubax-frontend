import { Injectable, inject } from '@angular/core';
import { PreloadingStrategy, Route } from '@angular/router';
import {
  AuthStore,
  type RouteAccess,
} from '@ubax-workspace/ubax-web-data-access';
import { Observable, of } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class SelectivePreloadStrategy implements PreloadingStrategy {
  private readonly authStore = inject(AuthStore);

  preload(route: Route, load: () => Observable<unknown>): Observable<unknown> {
    if (!route.data?.['preload']) {
      return of(null);
    }

    const { roles, scope } = (route.data as Partial<RouteAccess>) ?? {};
    const user = this.authStore.user();

    if (roles?.length) {
      if (!user || !roles.includes(user.mainRole)) {
        return of(null);
      }

      if (scope && user.scope !== scope) {
        return of(null);
      }
    }

    return load();
  }
}
