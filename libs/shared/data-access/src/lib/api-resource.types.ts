import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable } from 'rxjs';
import { StrictHttpResponse } from '@ubax-workspace/shared-api-types';

// Signature générique d'une fonction ng-openapi-gen avec params obligatoires
export type ApiHttpFn<P, R> = (
  http: HttpClient,
  rootUrl: string,
  params: P,
  context?: HttpContext,
) => Observable<StrictHttpResponse<R>>;

// Signature générique d'une fonction ng-openapi-gen avec params optionnels
export type ApiHttpFnOptional<P, R> = (
  http: HttpClient,
  rootUrl: string,
  params?: P,
  context?: HttpContext,
) => Observable<StrictHttpResponse<R>>;

// Union des deux signatures pour le champ list
export type AnyApiFn<P, R> = ApiHttpFn<P, R> | ApiHttpFnOptional<P, R>;

export type ApiFnParams<TFn> =
  TFn extends AnyApiFn<infer P, unknown> ? P : never;
export type ApiFnResponse<TFn> =
  TFn extends AnyApiFn<unknown, infer R> ? R : never;

type ApiFnLike = AnyApiFn<never, unknown>;

/**
 * Configuration passée à withApiResource / createApiStore.
 *
 * TItem  : le type de l'entité retournée par le backend
 * TRaw   : la shape brute de la réponse list (souvent un wrapper paginé)
 *           par défaut = TItem[] si le backend retourne directement un tableau
 */
export interface ApiResourceConfig<
  TItem,
  TListFn extends ApiFnLike | undefined = undefined,
  TGetByIdFn extends ApiFnLike | undefined = undefined,
  TCreateFn extends ApiFnLike | undefined = undefined,
  TUpdateFn extends ApiFnLike | undefined = undefined,
  TDeleteFn extends ApiFnLike | undefined = undefined,
> {
  /**
   * Fonction de liste (GET /resource).
   * Correspond à une fn/* générée par ng-openapi-gen.
   */
  list?: TListFn;

  /**
   * Extrait le tableau d'items depuis la réponse brute.
   * Utilisé pour gérer la pagination Spring Boot ({ content: T[], ... })
   * ou les wrappers CustomResponse ({ data: T[] }).
   * Défaut : tente content, data, ou identity.
   */
  mapList?: (raw: ApiFnResponse<NonNullable<TListFn>>) => TItem[];

  /**
   * Extrait les métadonnées de pagination depuis la réponse brute de list.
   * Si absent, tente d'extraire totalElements / totalPages automatiquement.
   * Retourner null si la réponse n'est pas paginée.
   */
  mapPagination?: (
    raw: ApiFnResponse<NonNullable<TListFn>>,
  ) => PaginationMeta | null;

  /**
   * Fonction get-by-id (GET /resource/:id).
   */
  getById?: TGetByIdFn;

  /**
   * Permet d'adapter une réponse get-by-id qui ne retourne pas directement TItem.
   */
  mapGetById?: (
    raw: ApiFnResponse<NonNullable<TGetByIdFn>>,
    requestedId: string,
  ) => TItem;

  /**
   * Permet d'adapter les endpoints dont le paramètre de route n'est pas `id`.
   */
  buildGetByIdParams?: (id: string) => ApiFnParams<NonNullable<TGetByIdFn>>;

  /**
   * Fonction de création (POST /resource).
   */
  create?: TCreateFn;

  mapCreate?: (raw: ApiFnResponse<NonNullable<TCreateFn>>) => TItem;

  /**
   * Fonction de mise à jour (PUT/PATCH /resource/:id).
   */
  update?: TUpdateFn;

  mapUpdate?: (raw: ApiFnResponse<NonNullable<TUpdateFn>>) => TItem;

  /**
   * Fonction de suppression (DELETE /resource/:id).
   */
  delete?: TDeleteFn;

  buildDeleteParams?: (id: string) => ApiFnParams<NonNullable<TDeleteFn>>;

  /**
   * Sélecteur d'identifiant de l'entité.
   * Défaut : item => item.id si présent
   */
  idSelector?: (item: TItem) => string;
}

export function defineApiResourceConfig<
  TItem,
  TListFn extends ApiFnLike | undefined = undefined,
  TGetByIdFn extends ApiFnLike | undefined = undefined,
  TCreateFn extends ApiFnLike | undefined = undefined,
  TUpdateFn extends ApiFnLike | undefined = undefined,
  TDeleteFn extends ApiFnLike | undefined = undefined,
>(
  config: ApiResourceConfig<
    TItem,
    TListFn,
    TGetByIdFn,
    TCreateFn,
    TUpdateFn,
    TDeleteFn
  >,
): ApiResourceConfig<
  TItem,
  TListFn,
  TGetByIdFn,
  TCreateFn,
  TUpdateFn,
  TDeleteFn
> {
  return config;
}

export interface PaginationMeta {
  totalElements: number;
  totalPages: number;
  currentPage: number;
  pageSize: number;
}

// État commun à toute ressource API
export interface ApiResourceState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  selectedId: string | null;
  pagination: PaginationMeta | null;
}

export const API_ERROR_MESSAGES = {
  load: 'Erreur lors du chargement',
  create: 'Erreur lors de la création',
  update: 'Erreur lors de la mise à jour',
  remove: 'Erreur lors de la suppression',
} as const;
