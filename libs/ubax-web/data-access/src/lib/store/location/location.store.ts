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
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { forkJoin, pipe, switchMap, tap } from 'rxjs';
import { Locataire } from '../../models/locataire.model';
import { Reservation } from '../../models/reservation.model';
import { LocatairesService } from '../../services/locataires.service';

interface LocationState {
  reservations: Reservation[];
  loading: boolean;
  error: string | null;
  selectedLocataireId: string | null;
}

export const LocationStore = signalStore(
  { providedIn: 'root' },
  withEntities<Locataire>(),
  withState<LocationState>({ reservations: [], loading: false, error: null, selectedLocataireId: null }),
  withComputed(({ entities, selectedLocataireId }) => ({
    locatairesActifs: computed(() => entities().filter((l) => l.statut === 'actif')),
    locatairesEnRetard: computed(() => entities().filter((l) => l.statut === 'en_retard')),
    selectedLocataire: computed(() => entities().find((l) => l.id === selectedLocataireId()) ?? null),
  })),
  withMethods((store, svc = inject(LocatairesService)) => ({
    selectLocataire(id: string | null): void {
      patchState(store, { selectedLocataireId: id });
    },

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getAll().pipe(
            tapResponse({
              next: (locataires) => patchState(store, setAllEntities(locataires), { loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur chargement locataires' }),
            }),
          ),
        ),
      ),
    ),

    update: rxMethod<{ id: string; changes: Partial<Locataire> }>(
      pipe(
        switchMap(({ id, changes }) =>
          svc.update(id, changes).pipe(
            tapResponse({
              next: (l) => patchState(store, updateEntity({ id: l.id, changes: l })),
              error: () => patchState(store, { error: 'Erreur mise à jour locataire' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
