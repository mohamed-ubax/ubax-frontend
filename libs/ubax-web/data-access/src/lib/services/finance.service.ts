import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Depense, Facture, Recette, Transaction } from '../models/finance.model';

@Injectable({ providedIn: 'root' })
export class FinanceService {
  private readonly http = inject(HttpClient);

  getDepenses(params?: { bienId?: string; dateDebut?: string; dateFin?: string }): Observable<Depense[]> {
    return this.http.get<Depense[]>('/api/finance/depenses', { params: params as Record<string, string> });
  }

  createDepense(payload: Omit<Depense, 'id'>): Observable<Depense> {
    return this.http.post<Depense>('/api/finance/depenses', payload);
  }

  getRecettes(params?: { bienId?: string; dateDebut?: string; dateFin?: string }): Observable<Recette[]> {
    return this.http.get<Recette[]>('/api/finance/recettes', { params: params as Record<string, string> });
  }

  getTransactions(): Observable<Transaction[]> {
    return this.http.get<Transaction[]>('/api/finance/transactions');
  }

  getFactures(): Observable<Facture[]> {
    return this.http.get<Facture[]>('/api/finance/factures');
  }

  getLoyersEnRetard(): Observable<Facture[]> {
    return this.http.get<Facture[]>('/api/finance/loyers-retard');
  }
}
