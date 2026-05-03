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
  if (Array.isArray(raw)) return raw;
  if (raw && typeof raw === 'object') {
    const record = raw as { content?: unknown; data?: unknown };

    if (Array.isArray(record.content)) return record.content;
    if (Array.isArray(record.data)) return record.data;
    if (record.data && typeof record.data === 'object') {
      const nested = (record.data as { content?: unknown }).content;
      if (Array.isArray(nested)) {
        return nested;
      }
    }
  }

  return [];
};
