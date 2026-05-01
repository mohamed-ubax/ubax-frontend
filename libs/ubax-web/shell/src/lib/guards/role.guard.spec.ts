import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { Router, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { AuthStore, Role } from '@ubax-workspace/ubax-web-data-access';
import { roleGuard } from './role.guard';

describe('roleGuard', () => {
  let router: { createUrlTree: ReturnType<typeof vi.fn> };

  function createInjector(role: Role | null): Injector {
    router = {
      createUrlTree: vi.fn().mockReturnValue({ redirectTo: '/tableau-de-bord' }),
    };
    return Injector.create({
      providers: [
        { provide: AuthStore, useValue: { role: () => role } },
        { provide: Router, useValue: router },
      ],
    });
  }

  function mockRoute(roles?: readonly Role[]): ActivatedRouteSnapshot {
    return { data: { roles } } as unknown as ActivatedRouteSnapshot;
  }

  it("retourne true quand aucun rôle n'est requis sur la route", () => {
    const injector = createInjector(null);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute(undefined), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it('retourne true quand la liste des rôles requis est vide', () => {
    const injector = createInjector(Role.COMPTABLE);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute([]), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it("retourne true quand l'utilisateur a un rôle autorisé", () => {
    const injector = createInjector(Role.DG);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute([Role.DG, Role.COMMERCIAL]), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });

  it("retourne un UrlTree vers /tableau-de-bord quand l'utilisateur n'a pas le rôle requis", () => {
    const injector = createInjector(Role.SAV);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute([Role.DG, Role.COMMERCIAL]), {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tableau-de-bord']);
    expect(result).toEqual({ redirectTo: '/tableau-de-bord' });
  });

  it("retourne un UrlTree quand l'utilisateur n'est pas authentifié (role null)", () => {
    const injector = createInjector(null);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute([Role.HOTEL]), {} as RouterStateSnapshot),
    );

    expect(router.createUrlTree).toHaveBeenCalledWith(['/tableau-de-bord']);
    expect(result).not.toBe(true);
  });

  it('retourne true pour DG sur une route réservée au DG', () => {
    const injector = createInjector(Role.DG);

    const result = runInInjectionContext(injector, () =>
      roleGuard(mockRoute([Role.DG]), {} as RouterStateSnapshot),
    );

    expect(result).toBe(true);
  });
});
