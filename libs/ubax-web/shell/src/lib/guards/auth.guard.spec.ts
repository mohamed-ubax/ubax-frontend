import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { AuthStore } from '@ubax-workspace/ubax-web-data-access';
import { authGuard } from './auth.guard';

describe('authGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  function createInjector(token: string | null): Injector {
    router = {
      createUrlTree: vi.fn().mockReturnValue({ redirectTo: '/connexion' }),
    };
    return Injector.create({
      providers: [
        { provide: AuthStore, useValue: { token: () => token } },
        { provide: Router, useValue: router },
      ],
    });
  }

  beforeEach(() => {
    // Supprime globalThis.location pour que redirectBrowserToPortalLogin retourne false
    Reflect.deleteProperty(globalThis, 'location');
  });

  it('retourne true quand le token est présent', () => {
    const injector = createInjector('valid-jwt-token');

    const result = runInInjectionContext(injector, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('retourne un UrlTree vers /connexion quand le token est absent', () => {
    const injector = createInjector(null);

    const result = runInInjectionContext(injector, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(
      ['/connexion'],
      expect.objectContaining({ queryParams: expect.any(Object) }),
    );
    expect(result).toEqual({ redirectTo: '/connexion' });
  });

  it('retourne true quand le token change de null à une valeur', () => {
    // D'abord sans token
    const injector = createInjector(null);
    const noToken = runInInjectionContext(injector, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(noToken).not.toBe(true);

    // Puis avec token
    const injectorWithToken = createInjector('new-token');
    const withToken = runInInjectionContext(injectorWithToken, () =>
      authGuard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot),
    );
    expect(withToken).toBe(true);
  });
});
