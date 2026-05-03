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
import { AgencyStore } from './agency.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    getTeamMembers1: vi.fn(),
    getSubRoles1: vi.fn(),
    addMember1: vi.fn(),
    assignSubRoles1: vi.fn(),
    revokeSubRole1: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

type AgencyTeamMember = AdminUserResponse & {
  active?: boolean;
};

const MEMBERS: AgencyTeamMember[] = [
  {
    userId: 'a-1',
    keycloakId: 'kc-a1',
    email: 'alpha@ubax.com',
    active: true,
    roles: ['PARTNER'],
  },
  {
    userId: 'a-2',
    keycloakId: 'kc-a2',
    email: 'beta@ubax.com',
    active: false,
    roles: ['PARTNER'],
  },
  {
    userId: 'a-3',
    keycloakId: 'kc-a3',
    email: 'gamma@ubax.com',
    active: true,
    roles: ['PARTNER'],
  },
];

const SUB_ROLES_BY_USER_ID: Record<string, string[]> = {
  'a-1': ['DIRECTEUR_AGENCE'],
  'a-2': ['COMMERCIAL'],
  'a-3': ['DIRECTEUR_AGENCE', 'COMPTABLE_AGENCE'],
};

type AgencyStoreContract = {
  entities(): AgencyTeamMember[];
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  membresActifs(): AgencyTeamMember[];
  membresFiltres(): AgencyTeamMember[];
  totalMembres(): number;
  memberSubRoles(): Record<string, readonly string[]>;
  memberSubRolesLoading(): Record<string, boolean>;
  memberSubRolesError(): Record<string, string | null>;
  load(params?: unknown): void;
  loadMemberSubRoles(userId: string): void;
  setFilterRole(role: string | null): void;
  inviterMembre(body: AddTeamMemberRequest): void;
  assignerSousRoles(params: { userId: string; body: AssignSubRolesRequest }): void;
  revoquerSousRole(params: { userId: string; role: string }): void;
};

describe('AgencyStore', () => {
  const storeToken =
    AgencyStore as unknown as ProviderToken<AgencyStoreContract>;
  const storeClass = AgencyStore as unknown as Type<unknown>;

  let store: AgencyStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.getTeamMembers1).mockImplementation(() =>
      of(toStrictResponse(MEMBERS)),
    );
    vi.mocked(apiTypes.getSubRoles1).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: SUB_ROLES_BY_USER_ID[params?.userId] ?? [],
          }),
        ) as any,
    );
    vi.mocked(apiTypes.addMember1).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            userId: 'new-a1',
            keycloakId: 'kc-new-a1',
            email: params?.body?.email ?? 'new@ubax.com',
            firstName: params?.body?.firstName ?? 'New',
            lastName: params?.body?.lastName ?? 'Member',
            active: true,
            roles: ['PARTNER'],
          } as AgencyTeamMember),
        ) as any,
    );
    vi.mocked(apiTypes.assignSubRoles1).mockImplementation(() =>
      of(new HttpResponse({ status: 200 })) as any,
    );
    vi.mocked(apiTypes.revokeSubRole1).mockImplementation(() =>
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
      store.load({});
      Object.keys(SUB_ROLES_BY_USER_ID).forEach((userId) =>
        store.loadMemberSubRoles(userId),
      );
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

    it('filtre les membres par sous-rôle hydraté', () => {
      store.setFilterRole('DIRECTEUR_AGENCE');

      expect(store.membresFiltres()).toHaveLength(2);
      expect(store.memberSubRoles()['a-1']).toEqual(['DIRECTEUR_AGENCE']);
      expect(store.memberSubRoles()['a-3']).toEqual([
        'DIRECTEUR_AGENCE',
        'COMPTABLE_AGENCE',
      ]);
    });
  });

  describe('loadMemberSubRoles', () => {
    it('hydrate les sous-rôles pour un membre donné', () => {
      store.load({});
      store.loadMemberSubRoles('a-2');

      expect(store.memberSubRoles()['a-2']).toEqual(['COMMERCIAL']);
      expect(store.memberSubRolesLoading()['a-2']).toBe(false);
      expect(store.memberSubRolesError()['a-2']).toBeNull();
    });

    it("capture l'erreur d'hydratation sans casser le store", () => {
      vi.mocked(apiTypes.getSubRoles1).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 503,
              url: '/v1/agency/team/a-1/sub-roles',
            }),
        ) as any,
      );

      store.load({});
      store.loadMemberSubRoles('a-1');

      expect(store.memberSubRoles()['a-1']).toEqual([]);
      expect(store.memberSubRolesLoading()['a-1']).toBe(false);
      expect(store.memberSubRolesError()['a-1']).toContain('503');
    });
  });

  describe('inviterMembre', () => {
    it('ajoute un nouveau membre à la liste et met en cache ses sous-rôles saisis', () => {
      store.load({});
      store.inviterMembre({
        email: 'new@ubax.com',
        firstName: 'Nouvel',
        lastName: 'Agent',
        subRoles: ['COMMERCIAL'],
      } as AddTeamMemberRequest);

      expect(store.entities()).toHaveLength(MEMBERS.length + 1);
      expect(store.entities().some((m) => m.userId === 'new-a1')).toBe(true);
      expect(store.memberSubRoles()['new-a1']).toEqual(['COMMERCIAL']);
      expect(store.isSaving()).toBe(false);
      expect(store.hasError()).toBe(false);
    });

    it("capture une erreur si l'invitation échoue", () => {
      store.load({});
      vi.mocked(apiTypes.addMember1).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 400,
              url: '/api/agency/team',
            }),
        ) as any,
      );

      store.inviterMembre({ email: 'fail@ubax.com' } as AddTeamMemberRequest);

      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });

  describe('assignerSousRoles et revoquerSousRole', () => {
    beforeEach(() => {
      store.load({});
      store.loadMemberSubRoles('a-2');
    });

    it('met à jour le cache local après assignation', () => {
      store.assignerSousRoles({
        userId: 'a-2',
        body: { scope: 'AGENCE', roles: ['COMPTABLE_AGENCE'] },
      });

      expect(store.memberSubRoles()['a-2']).toEqual([
        'COMMERCIAL',
        'COMPTABLE_AGENCE',
      ]);
      expect(store.isSaving()).toBe(false);
    });

    it('met à jour le cache local après révocation', () => {
      store.assignerSousRoles({
        userId: 'a-2',
        body: { scope: 'AGENCE', roles: ['COMPTABLE_AGENCE'] },
      });

      store.revoquerSousRole({
        userId: 'a-2',
        role: 'COMMERCIAL',
      });

      expect(store.memberSubRoles()['a-2']).toEqual(['COMPTABLE_AGENCE']);
      expect(store.isSaving()).toBe(false);
    });
  });
});
