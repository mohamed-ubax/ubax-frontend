import type { LaCodeListDto } from '@ubax-workspace/shared-api-types';

type UnknownRecord = Record<string, unknown>;

function asRecord(value: unknown): UnknownRecord | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as UnknownRecord)
    : null;
}

function readString(value: unknown): string | undefined {
  return typeof value === 'string' ? value.trim() : undefined;
}

function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function readCodeListCollection(raw: unknown): unknown[] {
  if (Array.isArray(raw)) return raw;

  const record = asRecord(raw);
  if (!record) return [];

  for (const key of ['results', 'content', 'items', 'data'] as const) {
    if (Array.isArray(record[key])) {
      return record[key] as unknown[];
    }
  }

  for (const key of ['data', 'payload', 'result'] as const) {
    const nested = asRecord(record[key]);
    if (!nested) continue;

    for (const nestedKey of ['results', 'content', 'items', 'data'] as const) {
      if (Array.isArray(nested[nestedKey])) {
        return nested[nestedKey] as unknown[];
      }
    }
  }

  return [];
}

export function normalizeCodeListItem(raw: unknown): LaCodeListDto | null {
  const record = asRecord(raw);
  if (!record) return null;

  const id = readString(record['id']);
  const type = readString(record['type']);
  const value = readString(record['value']);
  const description = readString(record['description']) ?? '';
  const systemAssign =
    readBoolean(record['systemAssign']) ??
    readBoolean(record['isSystemAssign']) ??
    false;

  if (!id && !type && !value && !description) {
    for (const key of ['data', 'item', 'result'] as const) {
      const nestedItem = normalizeCodeListItem(record[key]);
      if (nestedItem) return nestedItem;
    }
    return null;
  }

  return {
    id,
    type,
    value,
    description,
    systemAssign,
  };
}

export function sortCodeLists(entries: LaCodeListDto[]): LaCodeListDto[] {
  return [...entries].sort((left, right) => {
    const leftKey = `${left.type ?? ''}\u0000${left.value ?? ''}`;
    const rightKey = `${right.type ?? ''}\u0000${right.value ?? ''}`;

    return leftKey.localeCompare(rightKey, 'fr', { sensitivity: 'base' });
  });
}

export function normalizeCodeListCollection(raw: unknown): LaCodeListDto[] {
  return sortCodeLists(
    readCodeListCollection(raw)
      .map((entry) => normalizeCodeListItem(entry))
      .filter((entry): entry is LaCodeListDto => entry !== null),
  );
}

export function extractCodeListTypes(entries: LaCodeListDto[]): string[] {
  return [
    ...new Set(entries.map((entry) => entry.type).filter(Boolean) as string[]),
  ].sort((left, right) =>
    left.localeCompare(right, 'fr', { sensitivity: 'base' }),
  );
}
