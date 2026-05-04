import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ApiConfiguration,
  apply as applyPartner,
  type PartnerApplicationResponse,
} from '@ubax-workspace/shared-api-types';
import { map, Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class PartnerService {
  private readonly http = inject(HttpClient);
  private readonly apiConfig = inject(ApiConfiguration);

  apply(formData: FormData): Observable<PartnerApplicationResponse> {
    return applyPartner(this.http, this.apiConfig.rootUrl, {
      body: formData as object,
    }).pipe(map((response) => response.body as PartnerApplicationResponse));
  }
}
