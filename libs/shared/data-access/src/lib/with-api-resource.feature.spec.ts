import '@angular/compiler';
import {
  HttpClient,
  HttpErrorResponse,
  HttpResponse,
} from '@angular/common/http';
import { Injector, ProviderToken, Type } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import {
  ApiConfiguration,
  StrictHttpResponse,
} from '@ubax-workspace/shared-api-types';
import { createApiStore } from './create-api-store';

type ResourceItem = {
  id: string;
  name: string;
};

type ListResponse = {
  content: ResourceItem[];
};

type ListParams = {
  page: number;
};

type GetByIdParams = {
  id: string;
};

type CreateParams = {
  name: string;
};

type UpdateParams = {
  id: string;
  name: string;
};

type DeleteParams = {
  id: string;
};

type ResourceStoreContract = {
  entities(): ResourceItem[];
  selectedItem(): ResourceItem | null;
  count(): number;
  isEmpty(): boolean;
  isLoading(): boolean;
  isSaving(): boolean;
  hasError(): boolean;
  error(): string | null;
  select(id: string | null): void;
  clearError(): void;
  load(params: ListParams): void;
  loadOne(id: string): void;
  create(params: CreateParams): void;
  update(params: UpdateParams): void;
  remove(id: string): void;
};

function toStrictResponse<T>(body: T): StrictHttpResponse<T> {
  return new HttpResponse({ body }) as StrictHttpResponse<T>;
}

const listRequest =
  vi.fn<
    (
      http: HttpClient,
      rootUrl: string,
      params: ListParams,
    ) => Observable<StrictHttpResponse<ListResponse>>
  >();
const getByIdRequest =
  vi.fn<
    (
      http: HttpClient,
      rootUrl: string,
      params: GetByIdParams,
    ) => Observable<StrictHttpResponse<ResourceItem>>
  >();
const createRequest =
  vi.fn<
    (
      http: HttpClient,
      rootUrl: string,
      params: CreateParams,
    ) => Observable<StrictHttpResponse<ResourceItem>>
  >();
const updateRequest =
  vi.fn<
    (
      http: HttpClient,
      rootUrl: string,
      params: UpdateParams,
    ) => Observable<StrictHttpResponse<ResourceItem>>
  >();
const deleteRequest =
  vi.fn<
    (
      http: HttpClient,
      rootUrl: string,
      params: DeleteParams,
    ) => Observable<StrictHttpResponse<void>>
  >();

const ResourceStore = createApiStore<
  ResourceItem,
  typeof listRequest,
  typeof getByIdRequest,
  typeof createRequest,
  typeof updateRequest,
  typeof deleteRequest
>(
  {
    list: listRequest,
    mapList: (raw) => raw.content,
    getById: getByIdRequest,
    create: createRequest,
    update: updateRequest,
    delete: deleteRequest,
  },
  { providedIn: 'root' },
);

describe('withApiResource', () => {
  const resourceStoreToken =
    ResourceStore as unknown as ProviderToken<ResourceStoreContract>;
  const resourceStoreClass = ResourceStore as unknown as Type<unknown>;

  let store: ResourceStoreContract;
  let injector: Injector;

  beforeEach(() => {
    vi.clearAllMocks();

    listRequest.mockImplementation((_http, _rootUrl, params) =>
      of(
        toStrictResponse({
          content: [{ id: String(params.page), name: `Page ${params.page}` }],
        }),
      ),
    );
    getByIdRequest.mockImplementation((_http, _rootUrl, params) =>
      of(toStrictResponse({ id: params.id, name: `Item ${params.id}` })),
    );
    createRequest.mockImplementation((_http, _rootUrl, params) =>
      of(toStrictResponse({ id: 'created', name: params.name })),
    );
    updateRequest.mockImplementation((_http, _rootUrl, params) =>
      of(toStrictResponse({ id: params.id, name: params.name })),
    );
    deleteRequest.mockImplementation(() =>
      of(toStrictResponse<void>(undefined)),
    );

    injector = Injector.create({
      providers: [
        { provide: HttpClient, useValue: {} },
        {
          provide: ApiConfiguration,
          useValue: { rootUrl: 'https://test.local' },
        },
        { provide: resourceStoreToken, useClass: resourceStoreClass },
      ],
    });

    store = injector.get(resourceStoreToken);
  });

  it('loads list data and exposes computed state', () => {
    store.load({ page: 1 });

    expect(listRequest).toHaveBeenCalledTimes(1);
    expect(listRequest.mock.calls[0]?.[1]).toBe('https://test.local');
    expect(listRequest.mock.calls[0]?.[2]).toEqual({ page: 1 });
    expect(store.entities()).toEqual([{ id: '1', name: 'Page 1' }]);
    expect(store.count()).toBe(1);
    expect(store.isEmpty()).toBe(false);
    expect(store.isLoading()).toBe(false);

    store.select('1');

    expect(store.selectedItem()).toEqual({ id: '1', name: 'Page 1' });
  });

  it('supports loadOne, create, update and remove flows', () => {
    store.loadOne('42');

    expect(store.selectedItem()).toEqual({ id: '42', name: 'Item 42' });

    store.create({ name: 'Created item' });

    expect(store.entities()).toContainEqual({
      id: 'created',
      name: 'Created item',
    });
    expect(store.isSaving()).toBe(false);

    store.update({ id: 'created', name: 'Updated item' });

    expect(store.entities()).toContainEqual({
      id: 'created',
      name: 'Updated item',
    });

    store.remove('created');

    expect(store.entities()).toEqual([{ id: '42', name: 'Item 42' }]);
  });

  it('captures request errors and clears them explicitly', () => {
    const error = new HttpErrorResponse({
      status: 500,
      statusText: 'Server Error',
      url: 'https://test.local/resources',
    });

    listRequest.mockImplementationOnce(() => throwError(() => error));

    store.load({ page: 9 });

    expect(store.hasError()).toBe(true);
    expect(store.error()).toContain('500');
    expect(store.isLoading()).toBe(false);

    store.clearError();

    expect(store.error()).toBeNull();
  });
});
