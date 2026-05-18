import { inject, Injectable } from '@angular/core';
import {
  Api,
  create8,
  findAll,
  type LaCodeListDto,
  update3,
} from '@ubax-workspace/shared-api-types';
import { from, map, Observable } from 'rxjs';
import {
  normalizeCodeListCollection,
  normalizeCodeListItem,
} from './admin-code-lists.helpers';

function requireCodeListItem(raw: unknown): LaCodeListDto {
  const entry = normalizeCodeListItem(raw);

  if (!entry) {
    throw new Error('La reponse code list est invalide.');
  }

  return entry;
}

@Injectable({ providedIn: 'root' })
export class AdminCodeListsService {
  private readonly api = inject(Api);

  listCodeLists(): Observable<LaCodeListDto[]> {
    return from(
      this.api.invoke(findAll, {
        page: 0,
        size: 500,
        sort: ['type,asc', 'value,asc'],
      }),
    ).pipe(map((raw) => normalizeCodeListCollection(raw)));
  }

  createCodeList(payload: LaCodeListDto): Observable<LaCodeListDto> {
    return from(this.api.invoke(create8, { body: payload })).pipe(
      map((raw) => requireCodeListItem(raw)),
    );
  }

  updateCodeList(
    id: string,
    payload: LaCodeListDto,
  ): Observable<LaCodeListDto> {
    return from(this.api.invoke(update3, { id, body: payload })).pipe(
      map((raw) => requireCodeListItem(raw)),
    );
  }
}
