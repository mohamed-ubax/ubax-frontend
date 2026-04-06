import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Locataire } from '../models/locataire.model';

@Injectable({ providedIn: 'root' })
export class LocatairesService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Locataire[]> {
    return this.http.get<Locataire[]>('/api/locataires');
  }

  getById(id: string): Observable<Locataire> {
    return this.http.get<Locataire>(`/api/locataires/${id}`);
  }

  getByBien(bienId: string): Observable<Locataire[]> {
    return this.http.get<Locataire[]>(`/api/biens/${bienId}/locataires`);
  }

  create(payload: Omit<Locataire, 'id'>): Observable<Locataire> {
    return this.http.post<Locataire>('/api/locataires', payload);
  }

  update(id: string, payload: Partial<Locataire>): Observable<Locataire> {
    return this.http.patch<Locataire>(`/api/locataires/${id}`, payload);
  }
}
