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
  setAllEntities,
  updateEntity,
  withEntities,
} from '@ngrx/signals/entities';
import { rxMethod } from '@ngrx/signals/rxjs-interop';
import { pipe, switchMap, tap } from 'rxjs';
import { Demande, DemandeStatut } from '../../models/demande.model';
import { DemandesService } from '../../services/demandes.service';

interface DemandesState {
  loading: boolean;
  error: string | null;
  selectedId: string | null;
}

export const DemandesStore = signalStore(
  { providedIn: 'root' },
  withEntities<Demande>(),
  withState<DemandesState>({ loading: false, error: null, selectedId: null }),
  withComputed(({ entities, selectedId }) => ({
    nouvellesDemandes: computed(() => entities().filter((d) => d.statut === 'nouvelle')),
    demandesEnCours: computed(() => entities().filter((d) => d.statut === 'en_cours')),
    demandesUrgentes: computed(() => entities().filter((d) => d.priorite === 'urgente')),
    selectedDemande: computed(() => entities().find((d) => d.id === selectedId()) ?? null),
  })),
  withMethods((store, svc = inject(DemandesService)) => ({
    selectDemande(id: string | null): void {
      patchState(store, { selectedId: id });
    },

    loadAll: rxMethod<void>(
      pipe(
        tap(() => patchState(store, { loading: true })),
        switchMap(() =>
          svc.getAll().pipe(
            tapResponse({
              next: (demandes) => patchState(store, setAllEntities(demandes), { loading: false }),
              error: () => patchState(store, { loading: false, error: 'Erreur chargement demandes' }),
            }),
          ),
        ),
      ),
    ),

    updateStatut: rxMethod<{ id: string; statut: DemandeStatut; notes?: string }>(
      pipe(
        switchMap(({ id, statut, notes }) =>
          svc.updateStatut(id, statut, notes).pipe(
            tapResponse({
              next: (d) => patchState(store, updateEntity({ id: d.id, changes: d })),
              error: () => patchState(store, { error: 'Erreur mise à jour statut' }),
            }),
          ),
        ),
      ),
    ),
  })),
);
