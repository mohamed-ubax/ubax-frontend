import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import {
  AuthStore,
  UbaxRole,
  type RouteAccess,
  type UbaxScope,
} from '@ubax-workspace/ubax-web-data-access';
import { roleGuard } from './role.guard';
import type { User } from '@ubax-workspace/shared-data-access';

describe('roleGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  function createInjector(user: Pick<User, 'mainRole' | 'subRole' | 'scope'> | null): Injector {
    router = {
      createUrlTree: vi.fn().mockReturnValue({ redirectTo: '/tableau-de-bord' }),
    };
    return Injector.create({
      providers: [
        { provide: AuthStore, useValue: { user: () => user } },
        { provide: Router, useValue: router },
      ],
    });
  }

  function mockRoute(access?: Partial<RouteAccess>): ActivatedRouteSnapshot {
    return { data: access ?? {} } as unknown as ActivatedRouteSnapshot;
  }

  const partnerAgence = { mainRole: UbaxRole.PARTNER, subRole: null, scope: 'AGENCE' as UbaxScope };
  const partnerHotel = { mainRole: UbaxRole.PARTNER, subRole: null, scope: 'HOTEL' as UbaxScope };
  const partnerPendingScope = { mainRole: UbaxRole.PARTNER, subRole: null, scope: null };
  const admin = { mainRole: UbaxRole.ADMIN, subRole: null, scope: 'UBAX_INTERNAL' as UbaxScope };

  it("retourne true quand aucun rôle n'est requis sur la route", () => {
    const injector = createInjector(null);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute(undefined), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('retourne true quand la liste des rôles requis est vide', () => {
    const injector = createInjector(partnerAgence);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute({ roles: [] }), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it("retourne true quand l'utilisateur a un rôle autorisé", () => {
    const injector = createInjector(admin);

    const result = runInInjectionContext(injector, () =>
      roleGuard(
        mockRoute({ roles: [UbaxRole.ADMIN, UbaxRole.SUPER_ADMIN] }),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });

  it("retourne un UrlTree vers /tableau-de-bord quand l'utilisateur n'a pas le rôle requis", () => {
    const injector = createInjector(partnerAgence);

    const result = runInInjectionContext(injector, () =>
      roleGuard(
        mockRoute({ roles: [UbaxRole.ADMIN, UbaxRole.SUPER_ADMIN] }),
        {} as RouterStateSnapshot,
      ),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tableau-de-bord']);
    expect(result).toEqual({ redirectTo: '/tableau-de-bord' });
  });

  it("retourne un UrlTree quand l'utilisateur n'est pas authentifié (user null)", () => {
    const injector = createInjector(null);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute({ roles: [UbaxRole.PARTNER] }), {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tableau-de-bord']);
    expect(result).not.toBe(true);
  });

  it('retourne true pour PARTNER sur une route agence quand le scope correspond', () => {
    const injector = createInjector(partnerAgence);

    const result = runInInjectionContext(injector, () =>
      roleGuard(
        mockRoute({ roles: [UbaxRole.PARTNER], scope: 'AGENCE' }),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });

  it('redirige un partenaire hôtel qui tente d'accéder à une route agence', () => {
    const injector = createInjector(partnerHotel);

    const result = runInInjectionContext(injector, () =>
      roleGuard(
        mockRoute({ roles: [UbaxRole.PARTNER], scope: 'AGENCE' }),
        {} as RouterStateSnapshot,
      ),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tableau-de-bord']);
    expect(result).not.toBe(true);
  });

  it("laisse passer un partenaire tant que le scope n'est pas encore chargé", () => {
    const injector = createInjector(partnerPendingScope);

    const result = runInInjectionContext(injector, () =>
      roleGuard(
        mockRoute({ roles: [UbaxRole.PARTNER], scope: 'AGENCE' }),
        {} as RouterStateSnapshot,
      ),
    );

    expect(result).toBe(true);
  });
});
