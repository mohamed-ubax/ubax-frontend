import '@angular/compiler';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
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
    getTeamMembers: vi.fn(),
    getSubRoles: vi.fn(),
    addMember: vi.fn(),
    assignSubRoles: vi.fn(),
    removeMember: vi.fn(),
    revokeSubRole: vi.fn(),
    getTeamMembers1: vi.fn(),
    getSubRoles1: vi.fn(),
    addMember1: vi.fn(),
    assignSubRoles1: vi.fn(),
    removeMember1: vi.fn(),
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

const HOTEL_MEMBERS: AgencyTeamMember[] = [
  {
    userId: 'h-1',
    keycloakId: 'kc-h1',
    email: 'hotel@ubax.com',
    active: true,
    roles: ['PARTNER'],
  },
];

const HOTEL_SUB_ROLES_BY_USER_ID: Record<string, string[]> = {
  'h-1': ['RECEPTIONNISTE'],
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
  assignerSousRoles(params: {
    userId: string;
    body: AssignSubRolesRequest;
  }): void;
  desactiverMembre(userId: string): void;
  revoquerSousRole(params: { userId: string; role: string }): void;
};

describe('AgencyStore', () => {
  const storeToken =
    AgencyStore as unknown as ProviderToken<AgencyStoreContract>;
  const storeClass = AgencyStore as unknown as Type<unknown>;

  let store: AgencyStoreContract;

  beforeEach(() => {
    vi.clearAllMocks();

    vi.mocked(apiTypes.getTeamMembers).mockImplementation(() =>
      of(toStrictResponse(HOTEL_MEMBERS)),
    );
    vi.mocked(apiTypes.getTeamMembers1).mockImplementation(() =>
      of(toStrictResponse(MEMBERS)),
    );
    vi.mocked(apiTypes.getSubRoles).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: HOTEL_SUB_ROLES_BY_USER_ID[params?.userId] ?? [],
          }),
        ) as any,
    );
    vi.mocked(apiTypes.getSubRoles1).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: SUB_ROLES_BY_USER_ID[params?.userId] ?? [],
          }),
        ) as any,
    );
    vi.mocked(apiTypes.addMember).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            userId: 'new-h1',
            keycloakId: 'kc-new-h1',
            email: params?.body?.email ?? 'hotel-new@ubax.com',
            firstName: params?.body?.firstName ?? 'Hotel',
            lastName: params?.body?.lastName ?? 'Member',
            active: true,
            roles: ['PARTNER'],
          } as AgencyTeamMember),
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
    vi.mocked(apiTypes.assignSubRoles).mockImplementation(
      () => of(new HttpResponse({ status: 200 })) as any,
    );
    vi.mocked(apiTypes.assignSubRoles1).mockImplementation(
      () => of(new HttpResponse({ status: 200 })) as any,
    );
    vi.mocked(apiTypes.removeMember).mockImplementation(
      () => of(new HttpResponse({ status: 204 })) as any,
    );
    vi.mocked(apiTypes.removeMember1).mockImplementation(
      () => of(new HttpResponse({ status: 204 })) as any,
    );
    vi.mocked(apiTypes.revokeSubRole).mockImplementation(
      () => of(new HttpResponse({ status: 200 })) as any,
    );
    vi.mocked(apiTypes.revokeSubRole1).mockImplementation(
      () => of(new HttpResponse({ status: 200 })) as any,
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

  describe('API routing by scope', () => {
    it('charge les membres agence via /v1/agency/team', () => {
      store.load({ scope: 'AGENCE' });

      expect(apiTypes.getTeamMembers1).toHaveBeenCalledTimes(1);
      expect(apiTypes.getTeamMembers).not.toHaveBeenCalled();
      expect(store.entities().map((member) => member.userId)).toEqual([
        'a-1',
        'a-2',
        'a-3',
      ]);
    });

    it('charge les membres hotel via /v1/hotel/team', () => {
      store.load({ scope: 'HOTEL' });

      expect(apiTypes.getTeamMembers).toHaveBeenCalledTimes(1);
      expect(apiTypes.getTeamMembers1).not.toHaveBeenCalled();
      expect(store.entities().map((member) => member.userId)).toEqual(['h-1']);
    });

    it('route la lecture des sous-roles hotel vers /v1/hotel/team/:userId/sub-roles', () => {
      store.load({ scope: 'HOTEL' });
      store.loadMemberSubRoles('h-1');

      expect(apiTypes.getSubRoles).toHaveBeenCalledTimes(1);
      expect(apiTypes.getSubRoles1).not.toHaveBeenCalled();
      expect(store.memberSubRoles()['h-1']).toEqual(['RECEPTIONNISTE']);
    });

    it('route les mutations hotel vers les endpoints hotel correspondants', () => {
      store.load({ scope: 'HOTEL' });

      store.inviterMembre({
        email: 'hotel-new@ubax.com',
        firstName: 'Hotel',
        lastName: 'Member',
      } as AddTeamMemberRequest);
      store.assignerSousRoles({
        userId: 'h-1',
        body: { scope: 'HOTEL', roles: ['RECEPTIONNISTE'] },
      });
      store.revoquerSousRole({ userId: 'h-1', role: 'RECEPTIONNISTE' });
      store.desactiverMembre('h-1');

      expect(apiTypes.addMember).toHaveBeenCalledTimes(1);
      expect(apiTypes.addMember1).not.toHaveBeenCalled();
      expect(apiTypes.assignSubRoles).toHaveBeenCalledTimes(1);
      expect(apiTypes.assignSubRoles1).not.toHaveBeenCalled();
      expect(apiTypes.revokeSubRole).toHaveBeenCalledTimes(1);
      expect(apiTypes.revokeSubRole1).not.toHaveBeenCalled();
      expect(apiTypes.removeMember).toHaveBeenCalledTimes(1);
      expect(apiTypes.removeMember1).not.toHaveBeenCalled();
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
      expect(store.memberSubRolesError()['a-1']).toMatch(/503|maintenance/i);
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

  describe('desactiverMembre', () => {
    it('retire le membre et nettoie les caches de sous-rôles', () => {
      store.load({});
      store.loadMemberSubRoles('a-2');

      store.desactiverMembre('a-2');

      expect(store.entities().some((m) => m.userId === 'a-2')).toBe(false);
      expect(store.memberSubRoles()['a-2']).toBeUndefined();
      expect(store.memberSubRolesLoading()['a-2']).toBeUndefined();
      expect(store.memberSubRolesError()['a-2']).toBeUndefined();
      expect(store.isSaving()).toBe(false);
    });

    it('conserve la liste si la désactivation échoue', () => {
      store.load({});
      vi.mocked(apiTypes.removeMember1).mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 403,
              url: '/v1/agency/team/a-2',
            }),
        ) as any,
      );

      store.desactiverMembre('a-2');

      expect(store.entities().some((m) => m.userId === 'a-2')).toBe(true);
      expect(store.hasError()).toBe(true);
      expect(store.isSaving()).toBe(false);
    });
  });
});
