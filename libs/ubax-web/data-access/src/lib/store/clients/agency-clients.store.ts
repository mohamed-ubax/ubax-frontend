import { signalStore } from '@ngrx/signals';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  ClientUserResponse,
  getAgencyClients,
} from '@ubax-workspace/shared-api-types';

type AgencyClient = ClientUserResponse & { id: string };

function mapClientList(raw: unknown): AgencyClient[] {
  let items: ClientUserResponse[] = [];

  if (Array.isArray(raw)) {
    items = raw;
  } else if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    if (Array.isArray(r['content'])) items = r['content'] as ClientUserResponse[];
    else if (r['data'] && typeof r['data'] === 'object') {
      const d = r['data'] as Record<string, unknown>;
      if (Array.isArray(d['content'])) items = d['content'] as ClientUserResponse[];
      else if (Array.isArray(d['data'])) items = d['data'] as ClientUserResponse[];
    } else if (Array.isArray(r['data'])) {
      items = r['data'] as ClientUserResponse[];
    }
  }

  return items.map((c) => ({ ...c, id: c.id ?? '' }));
}

export const AgencyClientsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<AgencyClient, typeof getAgencyClients>({
    list: getAgencyClients,
    idSelector: (c) => c.id,
    mapList: mapClientList,
  }),
);
