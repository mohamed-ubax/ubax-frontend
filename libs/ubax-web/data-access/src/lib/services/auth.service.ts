import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { User } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);

  getMe(): Observable<User> {
    return this.http.get<User>('/api/auth/me');
  }

  logout(): Observable<void> {
    return this.http.post<void>('/api/auth/logout', {});
  }

  refreshToken(): Observable<{ accessToken: string }> {
    return this.http.post<{ accessToken: string }>('/api/auth/refresh', {});
  }
}
