import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  type PartnerApplicationResponse,
} from '@ubax-workspace/shared-api-types';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  apply(formData: FormData): Observable<PartnerApplicationResponse> {
    return this.http.post<PartnerApplicationResponse>(
      `${this.apiConfig.rootUrl}/v1/partner/apply`,
      formData,
    );
  }
}
