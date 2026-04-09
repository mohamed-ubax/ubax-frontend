import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Demande, DemandeStatut } from '../models/demande.model';

@Injectable({ providedIn: 'root' })
export class DemandesService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Demande[]> {
    return this.http.get<Demande[]>('/api/demandes');
  }

  getById(id: string): Observable<Demande> {
    return this.http.get<Demande>(`/api/demandes/${id}`);
  }

  updateStatut(id: string, statut: DemandeStatut, notes?: string): Observable<Demande> {
    return this.http.patch<Demande>(`/api/demandes/${id}/statut`, { statut, notes });
  }
}
