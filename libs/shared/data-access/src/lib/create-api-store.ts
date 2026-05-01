import { signalStore } from '@ngrx/signals';
import { type AnyApiFn, ApiResourceConfig } from './api-resource.types';
import { withApiResource } from './with-api-resource.feature';

/**
 * createApiStore<TItem>(config, opts?)
 *
 * Factory qui retourne un SignalStore complet prêt à l'emploi,
 * sans écrire de service ni de store boilerplate.
 *
 * @param config  - Config ApiResourceConfig avec les fn/ générées par ng-openapi-gen
 * @param opts    - Options Nx Signals : { providedIn: 'root' } pour un store global,
 *                  ou omis pour un scope composant (fourni via providers: [MyStore])
 *
 * ---
 * Exemple — store global (singleton) :
 *
 *   import { list1, getById, create2, update, archive } from '@ubax-workspace/shared-api-types';
 *
 *   export const PropertyStore = createApiStore<PropertyResponse>(
 *     { list: list1, getById, create: create2, update, delete: archive },
 *     { providedIn: 'root' }
 *   );
 *
 * ---
 * Exemple — store scopé au composant :
 *
 *   const TenantListStore = createApiStore<TenantResponse>({ list: list4, getById: getById2 });
 *
 *   @Component({
 *     providers: [TenantListStore],
 *   })
 *   export class TenantListComponent {
 *     readonly store = inject(TenantListStore);
 *
 *     ngOnInit() { this.store.load(); }
 *   }
 *
 * ---
 * Signaux exposés :
 *   store.entities()      — TItem[]
 *   store.selectedItem()  — TItem | null
 *   store.count()         — number
 *   store.isEmpty()       — boolean
 *   store.isLoading()     — boolean
 *   store.isSaving()      — boolean
 *   store.hasError()      — boolean
 *   store.error()         — string | null
 *
 * Méthodes exposées (selon config) :
 *   store.load(params?)
 *   store.loadOne(id)
 *   store.create(params)
 *   store.update(params)
 *   store.remove(id)
 *   store.select(id | null)
 *   store.clearError()
 */
export function createApiStore<
  TItem,
  TListFn extends AnyApiFn<never, unknown> | undefined = undefined,
  TGetByIdFn extends AnyApiFn<never, unknown> | undefined = undefined,
  TCreateFn extends AnyApiFn<never, unknown> | undefined = undefined,
  TUpdateFn extends AnyApiFn<never, unknown> | undefined = undefined,
  TDeleteFn extends AnyApiFn<never, unknown> | undefined = undefined,
>(
  config: ApiResourceConfig<
    TItem,
    TListFn,
    TGetByIdFn,
    TCreateFn,
    TUpdateFn,
    TDeleteFn
  >,
  opts: { providedIn: 'root' } | Record<string, never> = {},
) {
  const hasProvidedIn = 'providedIn' in opts;

  return hasProvidedIn
    ? signalStore(
        { providedIn: 'root' },
        withApiResource<
          TItem,
          TListFn,
          TGetByIdFn,
          TCreateFn,
          TUpdateFn,
          TDeleteFn
        >(config),
      )
    : signalStore(
        withApiResource<
          TItem,
          TListFn,
          TGetByIdFn,
          TCreateFn,
          TUpdateFn,
          TDeleteFn
        >(config),
      );
}
