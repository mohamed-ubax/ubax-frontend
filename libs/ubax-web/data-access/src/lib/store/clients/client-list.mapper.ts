import { ClientUserResponse } from '@ubax-workspace/shared-api-types';

type ClientWithRequiredId<TClient extends ClientUserResponse> = TClient & {
  id: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}

function extractClientItems(raw: unknown): ClientUserResponse[] {
  if (Array.isArray(raw)) {
    return raw as ClientUserResponse[];
  }

  if (!isRecord(raw)) {
    return [];
  }

  if (Array.isArray(raw['results'])) {
    return raw['results'] as ClientUserResponse[];
  }

  if (Array.isArray(raw['content'])) {
    return raw['content'] as ClientUserResponse[];
  }

  if (Array.isArray(raw['data'])) {
    return raw['data'] as ClientUserResponse[];
  }

  const nestedData = raw['data'];
  if (!isRecord(nestedData)) {
    return [];
  }

  if (Array.isArray(nestedData['results'])) {
    return nestedData['results'] as ClientUserResponse[];
  }

  if (Array.isArray(nestedData['content'])) {
    return nestedData['content'] as ClientUserResponse[];
  }

  if (Array.isArray(nestedData['data'])) {
    return nestedData['data'] as ClientUserResponse[];
  }

  return [];
}

export function mapClientList<TClient extends ClientUserResponse>(
  raw: unknown,
): ClientWithRequiredId<TClient>[] {
  return extractClientItems(raw).map((client) => ({
    ...(client as TClient),
    id: client.id ?? '',
  }));
}
