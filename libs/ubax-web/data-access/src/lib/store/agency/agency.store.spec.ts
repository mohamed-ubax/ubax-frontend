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
  roles?: Array<string>;
};

const MEMBERS: AgencyTeamMember[] = [
  {
    userId: 'a-1',
    keycloakId: 'kc-a1',
    email: 'alpha@ubax.com',
    active: true,
    roles: ['DIRECTEUR_AGENCE'],
  },
  {
    userId: 'a-2',
    keycloakId: 'kc-a2',
    email: 'beta@ubax.com',
    active: false,
    roles: ['COMMERCIAL'],
  },
  {
    userId: 'a-3',
    keycloakId: 'kc-a3',
    email: 'gamma@ubax.com',
    active: true,
    roles: ['DIRECTEUR_AGENCE', 'COMPTABLE_AGENCE'],
  },
];

type AgencyStoreContract = {
  entities(): AgencyTeamMember[];
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  membresActifs(): AgencyTeamMember[];
  membresFiltres(): AgencyTeamMember[];
  totalMembres(): number;
  load(params?: unknown): void;
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
    vi.mocked(apiTypes.addMember1).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            userId: 'new-a1',
            keycloakId: 'kc-new-a1',
            email: params?.body?.email ?? 'new@ubax.com',
            active: true,
            roles: [],
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
      store.setFilterRole('DIRECTEUR_AGENCE');
      expect(store.membresFiltres()).toHaveLength(2);
      expect(
        store.membresFiltres().every((m) =>
          m.roles?.includes('DIRECTEUR_AGENCE'),
        ),
      ).toBe(true);
    });
  });

  describe('inviterMembre', () => {
    it('ajoute un nouveau membre à la liste', () => {
      store.load();
      store.inviterMembre({ email: 'new@ubax.com' } as AddTeamMemberRequest);

      expect(store.entities()).toHaveLength(MEMBERS.length + 1);
      expect(store.entities().some((m) => m.userId === 'new-a1')).toBe(true);
      expect(store.isSaving()).toBe(false);
      expect(store.hasError()).toBe(false);
    });

    it("capture une erreur si l'invitation échoue", () => {
      store.load();
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
});
