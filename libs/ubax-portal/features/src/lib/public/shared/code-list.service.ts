import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { CodeListResponse, LaCodeListDto } from './code-list.model';

@Injectable({ providedIn: 'root' })
export class CodeListService {
  private readonly http = inject(HttpClient);

  getByType(type: string): Observable<LaCodeListDto[]> {
    return this.http
      .get<CodeListResponse>(`/code-list/type/${type}`)
      .pipe(map((res) => res.data));
  }
}
