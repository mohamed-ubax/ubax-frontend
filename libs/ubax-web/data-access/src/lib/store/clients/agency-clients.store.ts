import { signalStore } from '@ngrx/signals';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  ClientUserResponse,
  getAgencyClients,
} from '@ubax-workspace/shared-api-types';
import { mapClientList } from './client-list.mapper';

type AgencyClient = ClientUserResponse & { id: string };

export const AgencyClientsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<AgencyClient, typeof getAgencyClients>({
    list: getAgencyClients,
    idSelector: (c) => c.id,
    mapList: mapClientList,
  }),
);
