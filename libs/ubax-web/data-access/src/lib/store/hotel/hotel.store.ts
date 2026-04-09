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
import { Chambre, Employe } from '../../models/hotel.model';
import { HotelService } from '../../services/hotel.service';

interface HotelState {
  employes: Employe[];
  loading: boolean;
  error: string | null;
  selectedEmployeId: string | null;
}

export const HotelStore = signalStore(
  { providedIn: 'root' },
  withEntities<Chambre>(),
  withState<HotelState>({ employes: [], loading: false, error: null, selectedEmployeId: null }),
  withComputed(({ entities, employes, selectedEmployeId }) => ({
    chambresDisponibles: computed(() => entities().filter((c) => c.statut === 'disponible')),
    chambresOccupees: computed(() => entities().filter((c) => c.statut === 'occupee')),
    tauxOccupation: computed(() => {
      const total = entities().length;
      if (total === 0) return 0;
      return Math.round((entities().filter((c) => c.statut === 'occupee').length / total) * 100);
    }),
    employesActifs: computed(() => employes().filter((e) => e.actif)),
    selectedEmploye: computed(() => employes().find((e) => e.id === selectedEmployeId()) ?? null),
  })),
  withMethods((store, svc = inject(HotelService)) => ({
    selectEmploye(id: string | null): void {
      patchState(store, { selectedEmployeId: id });
    },

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          forkJoin({ chambres: svc.getChambres(), employes: svc.getEmployes() }).pipe(
            tapResponse({
              next: ({ chambres, employes }) =>
                patchState(store, setAllEntities(chambres), { employes, loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur chargement hotel' }),
            }),
          ),
        ),
      ),
    ),

    addChambre: rxMethod<Omit<Chambre, 'id'>>(
      pipe(
        switchMap((payload) =>
          svc.createChambre(payload).pipe(
            tapResponse({
              next: (chambre) => patchState(store, addEntity(chambre)),
              error: () => patchState(store, { error: 'Erreur création chambre' }),
            }),
          ),
        ),
      ),
    ),

    updateChambre: rxMethod<{ id: string; changes: Partial<Chambre> }>(
      pipe(
        switchMap(({ id, changes }) =>
          svc.updateChambre(id, changes).pipe(
            tapResponse({
              next: (c) => patchState(store, updateEntity({ id: c.id, changes: c })),
              error: () => patchState(store, { error: 'Erreur mise à jour chambre' }),
            }),
          ),
        ),
      ),
    ),

    addEmploye: rxMethod<Omit<Employe, 'id'>>(
      pipe(
        switchMap((payload) =>
          svc.createEmploye(payload).pipe(
            tapResponse({
              next: (e) => patchState(store, { employes: [...store.employes(), e] }),
              error: () => patchState(store, { error: 'Erreur création employé' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
