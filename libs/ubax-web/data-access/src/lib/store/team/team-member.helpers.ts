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

export const extractSubRolesFromTeamResponse = (
  response: unknown,
): TeamMemberSubRolesMap => {
  const subRolesMap: TeamMemberSubRolesMap = {};

  if (!response || typeof response !== 'object') {
    return subRolesMap;
  }

  const responseObj = response as Record<string, unknown>;

  // Handle different response structures
  let members: unknown[] = [];

  if (Array.isArray(response)) {
    members = response;
  } else if (responseObj['data']) {
    if (Array.isArray(responseObj['data'])) {
      members = responseObj['data'];
    } else if (
      (responseObj['data'] as Record<string, unknown>)['content'] &&
      Array.isArray((responseObj['data'] as Record<string, unknown>)['content'])
    ) {
      members = (responseObj['data'] as Record<string, unknown>)[
        'content'
      ] as unknown[];
    }
  } else if (responseObj['content'] && Array.isArray(responseObj['content'])) {
    members = responseObj['content'];
  }

  // Extract subroles from each member
  members.forEach((member) => {
    if (member && typeof member === 'object') {
      const memberObj = member as Record<string, unknown>;
      const memberId = resolveTeamMemberId(member as AdminUserResponse);

      if (memberId && memberObj['subroles']) {
        // Handle subroles array
        if (Array.isArray(memberObj['subroles'])) {
          subRolesMap[memberId] = (memberObj['subroles'] as unknown[]).filter(
            (role: unknown): role is string => typeof role === 'string',
          );
        } else if (typeof memberObj['subroles'] === 'string') {
          // Handle single subrole as string
          subRolesMap[memberId] = [memberObj['subroles'] as string];
        }
      }
    }
  });

  return subRolesMap;
};
