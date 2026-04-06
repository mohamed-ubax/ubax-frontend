import { computed, inject } from '@angular/core';
import { tapResponse } from '@ngrx/operators';
import {
  patchState,
  signalStore,
  withComputed,
  withMethods,
  withState,
} from '@ngrx/signals';
import {
  addEntity,
  removeEntity,
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Bien } from '../../models/bien.model';
import { BiensService } from '../../services/biens.service';

interface BiensState {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export const BiensStore = signalStore(
  { providedIn: 'root' },
  withEntities<Bien>(),
  withState<BiensState>({ loading: false, error: null, selectedId: null }),
  withComputed(({ entities, selectedId }) => ({
    biensDisponibles: computed(() => entities().filter((b) => b.statut === 'disponible')),
    biensLoues: computed(() => entities().filter((b) => b.statut === 'loue')),
    selectedBien: computed(() => entities().find((b) => b.id === selectedId()) ?? null),
    totalBiens: computed(() => entities().length),
  })),
  withMethods((store, svc = inject(BiensService)) => ({
    selectBien(id: string | null): void {
      patchState(store, { selectedId: id });
    },

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true, error: null })),
        switchMap(() =>
          svc.getAll().pipe(
            tapResponse({
              next: (biens) => patchState(store, setAllEntities(biens), { loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur de chargement des biens' }),
            }),
          ),
        ),
      ),
    ),

    create: rxMethod<Omit<Bien, 'id' | 'dateAjout'>>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap((payload) =>
          svc.create(payload).pipe(
            tapResponse({
              next: (bien) => patchState(store, addEntity(bien), { loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur lors de la création' }),
            }),
          ),
        ),
      ),
    ),

    update: rxMethod<{ id: string; changes: Partial<Bien> }>(
      pipe(
        switchMap(({ id, changes }) =>
          svc.update(id, changes).pipe(
            tapResponse({
              next: (bien) => patchState(store, updateEntity({ id: bien.id, changes: bien })),
              error: () => patchState(store, { error: 'Erreur lors de la mise à jour' }),
            }),
          ),
        ),
      ),
    ),

    remove: rxMethod<string>(
      pipe(
        switchMap((id) =>
          svc.delete(id).pipe(
            tapResponse({
              next: () => patchState(store, removeEntity(id)),
              error: () => patchState(store, { error: 'Erreur lors de la suppression' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
