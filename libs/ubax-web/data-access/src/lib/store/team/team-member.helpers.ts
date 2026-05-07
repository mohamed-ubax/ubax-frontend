import { AdminUserResponse } from '@ubax-workspace/shared-api-types';

export type TeamMemberSubRolesMap = Record<string, readonly string[]>;

export const resolveTeamMemberId = (member: AdminUserResponse): string =>
  member.userId ?? member.keycloakId ?? member.email ?? '';

export const teamMemberIdSelector = (member: AdminUserResponse): string =>
  resolveTeamMemberId(member);

export const readTeamMemberActive = (member: AdminUserResponse): boolean =>
  Boolean((member as { active?: unknown }).active);

export const readTeamMemberRoles = (member: AdminUserResponse): string[] => {
  const roles = (member as { roles?: unknown }).roles;

  if (!Array.isArray(roles)) {
    return [];
  }

  return roles.filter((role): role is string => typeof role === 'string');
};

function readArrayField(
  source: Record<string, unknown>,
  keys: readonly string[],
): unknown[] {
  for (const key of keys) {
    const value = source[key];
    if (Array.isArray(value)) {
      return value;
    }
  }

  return [];
}

function readNestedCollection(source: unknown): unknown[] {
  if (Array.isArray(source)) {
    return source;
  }

  if (!source || typeof source !== 'object') {
    return [];
  }

  const record = source as Record<string, unknown>;
  const direct = readArrayField(record, [
    'content',
    'data',
    'members',
    'items',
    'results',
  ]);

  if (direct.length > 0) {
    return direct;
  }

  const nestedCandidates = [
    record['data'],
    record['payload'],
    record['result'],
  ];

  for (const candidate of nestedCandidates) {
    const nested = readNestedCollection(candidate);
    if (nested.length > 0) {
      return nested;
    }
  }

  return [];
}

function extractMemberSubRoles(member: Record<string, unknown>): string[] {
  const raw = member['subroles'] ?? member['subRoles'] ?? member['sub-roles'];

  if (!Array.isArray(raw)) {
    return typeof raw === 'string' && raw.trim().length > 0 ? [raw] : [];
  }

  return raw
    .map((role) => {
      if (typeof role === 'string') {
        return role;
      }

      if (role && typeof role === 'object') {
        const roleRecord = role as Record<string, unknown>;
        const roleValue =
          roleRecord['role'] ?? roleRecord['name'] ?? roleRecord['value'];
        return typeof roleValue === 'string' ? roleValue : null;
      }

      return null;
    })
    .filter((role): role is string => typeof role === 'string');
}

export const readResolvedTeamMemberRoles = (
  member: AdminUserResponse,
  memberSubRoles: TeamMemberSubRolesMap,
): string[] => {
  const memberId = resolveTeamMemberId(member);

  if (
    memberId &&
    Object.prototype.hasOwnProperty.call(memberSubRoles, memberId)
  ) {
    return [...(memberSubRoles[memberId] ?? [])];
  }

  return readTeamMemberRoles(member);
};

export const mapTeamList = (raw: unknown): AdminUserResponse[] => {
  return readNestedCollection(raw) as AdminUserResponse[];
};

export const extractSubRolesFromTeamResponse = (
  response: unknown,
): TeamMemberSubRolesMap => {
  const subRolesMap: TeamMemberSubRolesMap = {};

  const members = readNestedCollection(response);

  // Extract subroles from each member
  members.forEach((member) => {
    if (member && typeof member === 'object') {
      const memberObj = member as Record<string, unknown>;
      const memberId = resolveTeamMemberId(member as AdminUserResponse);

      if (memberId) {
        subRolesMap[memberId] = extractMemberSubRoles(memberObj);
      }
    }
  });

  return subRolesMap;
};

export const extractAvatarUrlsFromTeamResponse = (
  response: unknown,
): Record<string, string> => {
  const avatarMap: Record<string, string> = {};

  const members = readNestedCollection(response);

  members.forEach((member) => {
    if (member && typeof member === 'object') {
      const memberObj = member as Record<string, unknown>;
      const memberId = resolveTeamMemberId(member as AdminUserResponse);
      const avatarCandidates = [
        memberObj['avatarUrl'],
        memberObj['avatar_url'],
        memberObj['avatar'],
        memberObj['picture'],
        memberObj['profilePicture'],
        memberObj['profile_picture'],
      ];

      const avatarUrl =
        avatarCandidates.find(
          (candidate): candidate is string =>
            typeof candidate === 'string' && candidate.trim().length > 0,
        ) ?? null;

      if (memberId && avatarUrl) {
        avatarMap[memberId] = avatarUrl;
      }
    }
  });

  return avatarMap;
};
