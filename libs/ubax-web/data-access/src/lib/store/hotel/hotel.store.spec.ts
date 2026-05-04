import '@angular/compiler';
import { HttpClient, HttpErrorResponse, HttpResponse } from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  AdminUserResponse,
  ApiConfiguration,
  type AddTeamMemberRequest,
  type AssignSubRolesRequest,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { HotelStore } from './hotel.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    getTeamMembers: vi.fn(),
    addMember: vi.fn(),
    assignSubRoles: vi.fn(),
    revokeSubRole: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type HotelTeamMember = AdminUserResponse & {
  active?: boolean;
  roles?: Array<string>;
};

const MEMBERS: HotelTeamMember[] = [
  {
    userId: 'u-1',
    keycloakId: 'kc-1',
    email: 'alpha@ubax.com',
    active: true,
    roles: ['MANAGER'],
  },
  {
    userId: 'u-2',
    keycloakId: 'kc-2',
    email: 'beta@ubax.com',
    active: false,
    roles: ['TECHNICIAN'],
  },
  {
    userId: 'u-3',
    keycloakId: 'kc-3',
    email: 'gamma@ubax.com',
    active: true,
    roles: ['MANAGER', 'SUPERVISOR'],
  },
];

type HotelStoreContract = {
  entities(): HotelTeamMember[];
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  membresActifs(): HotelTeamMember[];
  membresFiltres(): HotelTeamMember[];
  totalMembres(): number;
  load(params?: unknown): void;
  setFilterRole(role: string | null): void;
  inviterMembre(body: AddTeamMemberRequest): void;
  assignerSousRoles(params: { userId: string; body: AssignSubRolesRequest }): void;
  revoquerSousRole(params: { userId: string; role: string }): void;
};

describe('HotelStore', () => {
  const storeToken = HotelStore as unknown as ProviderToken<HotelStoreContract>;
  const storeClass = HotelStore as unknown as Type<unknown>;

  let store: HotelStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.getTeamMembers).mockImplementation(() =>
      of(toStrictResponse(MEMBERS)),
    );
    vi.mocked(apiTypes.addMember).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            userId: 'new-1',
            keycloakId: 'kc-new',
            email: params?.body?.email ?? 'new@ubax.com',
            active: true,
            roles: [],
          } as HotelTeamMember),
        ) as any,
    );
    vi.mocked(apiTypes.assignSubRoles).mockImplementation(() =>
      of(new HttpResponse({ status: 200 })) as any,
    );
    vi.mocked(apiTypes.revokeSubRole).mockImplementation(() =>
      of(new HttpResponse({ status: 200 })) as any,
    );

    const injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: {} },
        {
          provide: ApiConfiguration,
          useValue: { rootUrl: 'https://test.local' },
        },
        { provide: storeToken, useClass: storeClass },
      ],
    });

    store = injector.get(storeToken);
  });

  describe('computed selectors', () => {
    beforeEach(() => {
      store.load();
    });

    it('expose le nombre total de membres', () => {
      expect(store.totalMembres()).toBe(MEMBERS.length);
    });

    it('filtre les membres actifs', () => {
      expect(store.membresActifs()).toHaveLength(2);
      expect(store.membresActifs().every((m) => Boolean(m.active))).toBe(true);
    });

    it('retourne tous les membres quand filterRole est null', () => {
      store.setFilterRole(null);
      expect(store.membresFiltres()).toHaveLength(MEMBERS.length);
    });

    it('filtre les membres par rôle', () => {
      store.setFilterRole('MANAGER');
      expect(store.membresFiltres()).toHaveLength(2);
      expect(
        store.membresFiltres().every((m) => m.roles?.includes('MANAGER')),
      ).toBe(true);
    });

    it('retourne une liste vide pour un rôle inexistant', () => {
      store.setFilterRole('ADMIN');
      expect(store.membresFiltres()).toHaveLength(0);
    });
  });

  describe('inviterMembre', () => {
    it('ajoute un nouveau membre à la liste', () => {
      store.load();
      store.inviterMembre({ email: 'new@ubax.com' } as AddTeamMemberRequest);

      expect(store.entities()).toHaveLength(MEMBERS.length + 1);
      expect(store.entities().some((m) => m.userId === 'new-1')).toBe(true);
      expect(store.isSaving()).toBe(false);
      expect(store.hasError()).toBe(false);
    });

    it("capture une erreur si l'invitation échoue", () => {
      store.load();
      vi.mocked(apiTypes.addMember).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              url: '/api/hotel/team',
            }),
        ) as any,
      );

      store.inviterMembre({ email: 'fail@ubax.com' } as AddTeamMemberRequest);

      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });

  describe('assignerSousRoles', () => {
    it("complète sans erreur et réinitialise l'état saving", () => {
      store.load();
      store.assignerSousRoles({
        userId: 'u-1',
        body: { roles: ['SUPERVISOR'] },
      });

      expect(store.isSaving()).toBe(false);
      expect(store.hasError()).toBe(false);
    });

    it("capture une erreur si l'assignation échoue", () => {
      store.load();
      vi.mocked(apiTypes.assignSubRoles).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 422,
              url: '/api/hotel/team/u-1/sub-roles',
            }),
        ) as any,
      );

      store.assignerSousRoles({ userId: 'u-1', body: { roles: ['SUPERVISOR'] } });

      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });

  describe('revoquerSousRole', () => {
    it('révoque un sous-rôle sans erreur', () => {
      store.load();
      store.revoquerSousRole({ userId: 'u-1', role: 'MANAGER' });

      expect(store.hasError()).toBe(false);
    });

    it('capture une erreur si la révocation échoue', () => {
      store.load();
      vi.mocked(apiTypes.revokeSubRole).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 500,
              url: '/api/hotel/team/u-1/sub-roles/MANAGER',
            }),
        ) as any,
      );

      store.revoquerSousRole({ userId: 'u-1', role: 'MANAGER' });

      expect(store.hasError()).toBe(true);
    });
  });
});
