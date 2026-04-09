import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Chambre, Employe } from '../models/hotel.model';

@Injectable({ providedIn: 'root' })
export class HotelService {
  private readonly http = inject(HttpClient);

  // Chambres
  getChambres(): Observable<Chambre[]> {
    return this.http.get<Chambre[]>('/api/hotel/chambres');
  }

  createChambre(payload: Omit<Chambre, 'id'>): Observable<Chambre> {
    return this.http.post<Chambre>('/api/hotel/chambres', payload);
  }

  updateChambre(id: string, payload: Partial<Chambre>): Observable<Chambre> {
    return this.http.patch<Chambre>(`/api/hotel/chambres/${id}`, payload);
  }

  // Employés
  getEmployes(): Observable<Employe[]> {
    return this.http.get<Employe[]>('/api/hotel/employes');
  }

  getEmployeById(id: string): Observable<Employe> {
    return this.http.get<Employe>(`/api/hotel/employes/${id}`);
  }

  createEmploye(payload: Omit<Employe, 'id'>): Observable<Employe> {
    return this.http.post<Employe>('/api/hotel/employes', payload);
  }

  updateEmploye(id: string, payload: Partial<Employe>): Observable<Employe> {
    return this.http.patch<Employe>(`/api/hotel/employes/${id}`, payload);
  }
}
