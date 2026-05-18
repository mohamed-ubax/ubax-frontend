import { signalStore } from '@ngrx/signals';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  ClientUserResponse,
  getHotelClients,
} from '@ubax-workspace/shared-api-types';
import { mapClientList } from './client-list.mapper';

type HotelClient = ClientUserResponse & { id: string };

export const HotelClientsStore = signalStore(
  { providedIn: 'root' },
  withApiResource<HotelClient, typeof getHotelClients>({
    list: getHotelClients,
    idSelector: (c) => c.id,
    mapList: mapClientList,
  }),
);
