import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Bien } from '../models/bien.model';

@Injectable({ providedIn: 'root' })
export class BiensService {
  private readonly http = inject(HttpClient);

  getAll(): Observable<Bien[]> {
    return this.http.get<Bien[]>('/api/biens');
  }

  getById(id: string): Observable<Bien> {
    return this.http.get<Bien>(`/api/biens/${id}`);
  }

  create(payload: Omit<Bien, 'id' | 'dateAjout'>): Observable<Bien> {
    return this.http.post<Bien>('/api/biens', payload);
  }

  update(id: string, payload: Partial<Bien>): Observable<Bien> {
    return this.http.patch<Bien>(`/api/biens/${id}`, payload);
  }

  delete(id: string): Observable<void> {
    return this.http.delete<void>(`/api/biens/${id}`);
  }
}
