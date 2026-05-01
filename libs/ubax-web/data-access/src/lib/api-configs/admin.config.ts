import {
  createAdmin,
  deleteAdmin,
  listAdmins,
} from '@ubax-workspace/shared-api-types';
import { defineApiResourceConfig } from '@ubax-workspace/shared-data-access';

export const adminApiConfig = defineApiResourceConfig({
  list: listAdmins,
  create: createAdmin,
  delete: deleteAdmin,
  buildDeleteParams: (id) => ({ userId: id }),
  idSelector: (item) => item.userId ?? item.keycloakId ?? item.email ?? '',
  mapList: (raw: unknown) => {
    if (Array.isArray(raw)) return raw;
    if (raw && typeof raw === 'object') {
      const record = raw as { data?: unknown; content?: unknown };

      if (Array.isArray(record.data)) return record.data;
      if (Array.isArray(record.content)) return record.content;

      if (record.data && typeof record.data === 'object') {
        const nested = (record.data as { content?: unknown }).content;
        if (Array.isArray(nested)) {
          return nested;
        }
      }
    }

    return raw ? [raw] : [];
  },
});
