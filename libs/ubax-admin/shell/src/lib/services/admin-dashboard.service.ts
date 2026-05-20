import { inject, Injectable } from '@angular/core';
import {
  Api,
  type AdminDashboardResponse,
  getAdminDashboard,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';

function normalizeDashboardResponse(raw: unknown): AdminDashboardResponse {
  if (!raw || typeof raw !== 'object') {
    return {};
  }

  const body = raw as { data?: unknown };
  if (body.data && typeof body.data === 'object') {
    return body.data as AdminDashboardResponse;
  }

  return raw as AdminDashboardResponse;
}

@Injectable({ providedIn: 'root' })
export class AdminDashboardService {
  private readonly api = inject(Api);

  loadDashboard(): Observable<AdminDashboardResponse> {
    return from(this.api.invoke(getAdminDashboard)).pipe(
      map((raw) => normalizeDashboardResponse(raw)),
    );
  }
}
