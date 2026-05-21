import { signalStore } from '@ngrx/signals';
import { withApiResource } from '@ubax-workspace/shared-data-access';
import {
  AgencyBailleurResponse,
  listAgencyBailleurs,
} from '@ubax-workspace/shared-api-types';

export type AgencyBailleur = AgencyBailleurResponse & {
  id: string;
};

function extractAgencyBailleurs(raw: unknown): AgencyBailleur[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => extractAgencyBailleur(item));
  }

  if (!raw || typeof raw !== 'object') {
    return [];
  }

  const record = raw as Record<string, unknown>;
  const direct = record['results'] ?? record['content'];

  if (Array.isArray(direct)) {
    return direct.map((item) => extractAgencyBailleur(item));
  }

  const nested = record['data'];
  if (nested && typeof nested === 'object') {
    return extractAgencyBailleurs(nested);
  }

  return [];
}

function extractAgencyBailleur(raw: unknown, fallbackId = ''): AgencyBailleur {
  if (!raw || typeof raw !== 'object') {
    return { id: fallbackId };
  }

  const record = raw as Record<string, unknown>;
  const source =
    record['data'] && typeof record['data'] === 'object'
      ? (record['data'] as Record<string, unknown>)
      : record;

  const bailleur = source as AgencyBailleurResponse;

  return {
    ...bailleur,
    id: bailleur.id ?? fallbackId,
  };
}

export const AgencyBailleursStore = signalStore(
  withApiResource<AgencyBailleur, typeof listAgencyBailleurs>({
    list: listAgencyBailleurs,
    idSelector: (bailleur) => bailleur.id,
    mapList: extractAgencyBailleurs,
  }),
);
