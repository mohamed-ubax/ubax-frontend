import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { PartnerApplyApiResponse } from '../models/partner-application.model';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private readonly http = inject(HttpClient);

  apply(formData: FormData): Observable<PartnerApplyApiResponse> {
    return this.http.post<PartnerApplyApiResponse>(
      '/api/v1/partner/apply',
      formData,
    );
  }
}
