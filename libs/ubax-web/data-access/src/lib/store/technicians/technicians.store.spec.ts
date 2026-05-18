import '@angular/compiler';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { of, throwError } from 'rxjs';
import {
  ApiConfiguration,
  type StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import * as apiTypes from '@ubax-workspace/shared-api-types';
import { TechniciansStore, type Technician } from './technicians.store';

vi.mock('@ubax-workspace/shared-api-types', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('@ubax-workspace/shared-api-types')>();
  return {
    ...actual,
    list1: vi.fn(),
    getById: vi.fn(),
    create2: vi.fn(),
    update: vi.fn(),
    toggleAvailability: vi.fn(),
    delete$: vi.fn(),
    findAllByType: vi.fn(),
    uploadAvatar1: vi.fn(),
  };
});

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

const TECHNICIANS: Technician[] = [
  {
    id: 'tech-1',
    firstName: 'Awa',
    lastName: 'Traore',
    phone: '+2250700000001',
    avatarUrl: 'https://storage.test.local/technicians/avatar-tech-1.png',
    profession: 'PLOMBERIE',
    available: true,
  },
  {
    id: 'tech-2',
    firstName: 'Serge',
    lastName: 'Kouame',
    phone: '+2250700000002',
    profession: 'ELECTRICITE',
    available: false,
  },
];

type TechniciansStoreContract = {
  entities(): Technician[];
  availableTechnicians(): Technician[];
  professionOptions(): readonly {
    value: string;
    label: string;
    description: string;
  }[];
  load(params?: unknown): void;
  loadProfessions(): void;
  createTechnician(body: unknown): void;
  updateTechnician(params: { id: string; body: unknown }): void;
  toggleTechnicianAvailability(id: string): void;
  archiveTechnician(id: string): void;
  saving(): boolean;
  error(): string | null;
};

describe('TechniciansStore', () => {
  const storeToken =
    TechniciansStore as unknown as ProviderToken<TechniciansStoreContract>;
  const storeClass = TechniciansStore as unknown as Type<unknown>;

  let store: TechniciansStoreContract;

  beforeEach(() => {
    vi.mocked(apiTypes.list1).mockImplementation(() =>
      of(toStrictResponse({ data: { results: TECHNICIANS } })),
    );
    vi.mocked(apiTypes.create2).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: {
              id: 'tech-3',
              available: true,
              ...params.body,
            },
          }),
        ),
    );
    vi.mocked(apiTypes.update).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: {
              id: params.id,
              available: true,
              ...params.body,
            },
          }),
        ),
    );
    vi.mocked(apiTypes.toggleAvailability).mockImplementation(
      (_http, _rootUrl, params: any) =>
        of(
          toStrictResponse({
            data: {
              ...TECHNICIANS.find((technician) => technician.id === params.id),
              id: params.id,
              available: false,
            },
          }),
        ),
    );
    vi.mocked(apiTypes.delete$).mockImplementation(() =>
      of(toStrictResponse({ data: true })),
    );
    vi.mocked(apiTypes.findAllByType).mockImplementation(() =>
      of(
        toStrictResponse({
          data: [
            {
              id: 'PLOMBERIE',
              value: 'PLOMBERIE',
              description: 'Plomberie',
            },
          ],
        }),
      ),
    );
    vi.mocked(apiTypes.uploadAvatar1).mockImplementation(() =>
      of(
        toStrictResponse({
          data: {
            avatarUrl:
              'https://storage.test.local/technicians/avatar-tech-3.png',
          },
        }),
      ),
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

  it('charge et mappe la liste des techniciens', () => {
    store.load();

    expect(store.entities()).toHaveLength(2);
    expect(store.entities()[0]?.id).toBe('tech-1');
    expect(store.entities()[0]?.avatarUrl).toBe(
      'https://storage.test.local/technicians/avatar-tech-1.png',
    );
    expect(store.availableTechnicians()).toHaveLength(1);
  });

  it('charge les professions a partir de la code-list backend', () => {
    store.loadProfessions();

    expect(store.professionOptions()).toEqual([
      {
        value: 'PLOMBERIE',
        label: 'Plomberie',
        description: 'Plomberie',
      },
    ]);
  });

  it('cree un technicien et l ajoute au store', () => {
    const avatarFile = new File(['avatar'], 'avatar-tech-3.png', {
      type: 'image/png',
    });

    store.createTechnician({
      firstName: 'Mariam',
      lastName: 'Diallo',
      phone: '+2250700000003',
      avatarFile,
    });

    expect(
      store.entities().some((technician) => technician.id === 'tech-3'),
    ).toBe(true);
    expect(apiTypes.uploadAvatar1).toHaveBeenCalledWith(
      expect.anything(),
      'https://test.local',
      {
        id: 'tech-3',
        body: { file: avatarFile },
      },
    );
    expect(vi.mocked(apiTypes.create2).mock.calls[0]?.[2]).toMatchObject({
      body: expect.objectContaining({
        firstName: 'Mariam',
        lastName: 'Diallo',
        phone: '+2250700000003',
      }),
    });
    expect(
      store.entities().find((technician) => technician.id === 'tech-3')
        ?.avatarUrl,
    ).toBe('https://storage.test.local/technicians/avatar-tech-3.png');
    expect(store.saving()).toBe(false);
  });

  it('met a jour un technicien existant', () => {
    store.load();
    store.updateTechnician({
      id: 'tech-1',
      body: { profession: 'CLIMATISATION' },
    });

    expect(
      store.entities().find((technician) => technician.id === 'tech-1')
        ?.profession,
    ).toBe('CLIMATISATION');
  });

  it('uploade l avatar via la route du technicien lors d une mise a jour', () => {
    const avatarFile = new File(['avatar'], 'avatar-tech-1.png', {
      type: 'image/png',
    });

    store.load();
    store.updateTechnician({
      id: 'tech-1',
      body: {
        profession: 'CLIMATISATION',
        avatarFile,
      },
    });

    expect(apiTypes.uploadAvatar1).toHaveBeenCalledWith(
      expect.anything(),
      'https://test.local',
      {
        id: 'tech-1',
        body: { file: avatarFile },
      },
    );
    expect(
      store.entities().find((technician) => technician.id === 'tech-1')
        ?.avatarUrl,
    ).toBe('https://storage.test.local/technicians/avatar-tech-3.png');
  });

  it('bascule la disponibilite d un technicien', () => {
    store.load();
    store.toggleTechnicianAvailability('tech-1');

    expect(
      store.entities().find((technician) => technician.id === 'tech-1')
        ?.available,
    ).toBe(false);
  });

  it('archive un technicien', () => {
    store.load();
    store.archiveTechnician('tech-2');

    expect(
      store.entities().some((technician) => technician.id === 'tech-2'),
    ).toBe(false);
  });

  it('stocke une erreur reseau sur echec de creation', () => {
    vi.mocked(apiTypes.create2).mockReturnValueOnce(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 400,
            url: '/v1/technicians',
          }),
      ),
    );

    store.createTechnician({ firstName: 'Bad' });

    expect(store.error()).toBeTruthy();
    expect(store.saving()).toBe(false);
  });
});
