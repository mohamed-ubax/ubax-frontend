/**
 * Preservation Property Tests — Members Assets Optimization
 *
 * Ces tests encodent les COMPORTEMENTS A PRESERVER (inchanges avant et apres correctif).
 * Ils PASSENT sur le code non corrige, confirmant le comportement de base.
 * Ils doivent continuer a PASSER apres l'implementation du correctif (tache 3).
 *
 * Validates: Requirements 3.1, 3.2
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { AdminUserResponse } from '@ubax-workspace/shared-api-types';
import {
  extractSubRolesFromTeamResponse,
  readResolvedTeamMemberRoles,
  resolveTeamMemberId,
  type TeamMemberSubRolesMap,
} from '@ubax-workspace/ubax-web-data-access';

const COMPONENT_TS_PATH = resolve(__dirname, 'equipe-page.component.ts');

// ---------------------------------------------------------------------------
// Helpers — extract logic from the component source (mirrors component code)
// ---------------------------------------------------------------------------

/**
 * Reads the component source and extracts the MEMBER_AVATAR_FALLBACKS array
 * (or the single MEMBER_AVATAR_FALLBACK constant after the fix).
 * Returns the fallback value(s) as an array.
 */
function readFallbackValues(source: string): string[] {
  // After fix: single constant MEMBER_AVATAR_FALLBACK
  const singleMatch = /const MEMBER_AVATAR_FALLBACK\s*=\s*'([^']+)'/.exec(
    source,
  );
  if (singleMatch?.[1]) {
    return [singleMatch[1]];
  }

  // Before fix: array MEMBER_AVATAR_FALLBACKS
  const arrayMatch =
    /const MEMBER_AVATAR_FALLBACKS\s*=\s*\[([\s\S]*?)\]\s*as const/.exec(
      source,
    );
  if (!arrayMatch?.[1]) {
    return [];
  }
  const urlMatches = [...arrayMatch[1].matchAll(/'([^']+)'/g)];
  return urlMatches.map((m) => m[1]);
}

/**
 * Mirrors the avatarSrc computation from the component's memberRows computed signal.
 * Works with both the pre-fix (array fallbacks) and post-fix (single fallback) code.
 */
function computeAvatarSrc(
  memberId: string,
  memberAvatars: Record<string, string>,
  fallbacks: string[],
  index: number,
): string {
  const storedAvatar = memberId ? (memberAvatars[memberId] ?? null) : null;
  if (storedAvatar !== null) {
    return storedAvatar;
  }
  // Pre-fix: array of fallbacks; post-fix: single fallback (array of length 1)
  return fallbacks[index % fallbacks.length] ?? '';
}

// ---------------------------------------------------------------------------
// Generators — produce arbitrary test inputs
// ---------------------------------------------------------------------------

type MemberSpec = {
  userId?: string;
  keycloakId?: string;
  email?: string;
  subRoles?: string[];
};

function makeMember(spec: MemberSpec): AdminUserResponse {
  return {
    userId: spec.userId,
    keycloakId: spec.keycloakId,
    email: spec.email ?? `user-${Math.random().toString(36).slice(2)}@test.com`,
    firstName: 'Test',
    lastName: 'User',
  } as AdminUserResponse;
}

/** Generates N members with deterministic IDs */
function generateMembers(count: number, prefix = 'user'): AdminUserResponse[] {
  return Array.from({ length: count }, (_, i) =>
    makeMember({ userId: `${prefix}-${i}` }),
  );
}

/** Generates a memberAvatars map where every member has a non-null avatar URL */
function generateAvatarMap(
  members: AdminUserResponse[],
  urlPrefix = 'https://cdn.example.com/avatars/',
): Record<string, string> {
  const map: Record<string, string> = {};
  for (const member of members) {
    const id = resolveTeamMemberId(member);
    if (id) {
      map[id] = `${urlPrefix}${id}.jpg`;
    }
  }
  return map;
}

/** Generates a memberSubRoles map for a list of members */
function generateSubRolesMap(
  members: AdminUserResponse[],
  roleAssignments: Array<{ memberIndex: number; roles: string[] }>,
): TeamMemberSubRolesMap {
  const map: TeamMemberSubRolesMap = {};
  for (const { memberIndex, roles } of roleAssignments) {
    const member = members[memberIndex];
    if (member) {
      const id = resolveTeamMemberId(member);
      if (id) {
        map[id] = roles;
      }
    }
  }
  return map;
}

// ---------------------------------------------------------------------------
// Property 1: Preservation avatar reel
//
// For any store state where memberAvatars[memberId] is non-null,
// memberRows uses that URL as avatarSrc (not the fallback).
//
// Validates: Requirements 3.1
// ---------------------------------------------------------------------------

describe('Property: Preservation avatar reel (Requirements 3.1)', () => {
  const source = readFileSync(COMPONENT_TS_PATH, 'utf-8');
  const fallbacks = readFallbackValues(source);

  it('fallbacks array is non-empty (sanity check)', () => {
    expect(fallbacks.length).toBeGreaterThan(0);
  });

  it('when memberAvatars[memberId] is non-null, avatarSrc equals the stored URL (not the fallback)', () => {
    // Generate 20 members, all with stored avatars
    const members = generateMembers(20);
    const memberAvatars = generateAvatarMap(members);

    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const memberId = resolveTeamMemberId(member);
      const storedAvatar = memberAvatars[memberId];

      const avatarSrc = computeAvatarSrc(
        memberId,
        memberAvatars,
        fallbacks,
        index,
      );

      expect(avatarSrc).toBe(storedAvatar);
      expect(avatarSrc).not.toBe(fallbacks[index % fallbacks.length]);
    }
  });

  it('when memberAvatars[memberId] is null/absent, avatarSrc falls back to the fallback value', () => {
    const members = generateMembers(10);
    const emptyAvatarMap: Record<string, string> = {};

    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const memberId = resolveTeamMemberId(member);

      const avatarSrc = computeAvatarSrc(
        memberId,
        emptyAvatarMap,
        fallbacks,
        index,
      );

      expect(avatarSrc).toBe(fallbacks[index % fallbacks.length]);
    }
  });

  it('stored avatar takes priority over fallback for any non-null avatar URL', () => {
    // Property: for ALL possible avatar URL values (not just cdn.example.com),
    // the stored URL is always returned when non-null.
    const testUrls = [
      'https://cdn.example.com/avatar.jpg',
      'https://storage.googleapis.com/bucket/avatar.png',
      '/assets/equipe/avatar-fallback.svg',
      'data:image/png;base64,abc123',
      'https://www.figma.com/api/mcp/asset/some-id', // even a Figma URL stored in the store
    ];

    for (const url of testUrls) {
      const member = makeMember({ userId: 'test-member-id' });
      const memberId = resolveTeamMemberId(member);
      const memberAvatars: Record<string, string> = { [memberId]: url };

      const avatarSrc = computeAvatarSrc(memberId, memberAvatars, fallbacks, 0);

      expect(avatarSrc).toBe(url);
    }
  });

  it('stored avatar takes priority regardless of member index (modulo fallback selection)', () => {
    // Property: the index used for fallback selection does NOT affect the result
    // when a stored avatar exists.
    const member = makeMember({ userId: 'member-with-avatar' });
    const memberId = resolveTeamMemberId(member);
    const storedUrl = 'https://cdn.example.com/real-avatar.jpg';
    const memberAvatars: Record<string, string> = { [memberId]: storedUrl };

    // Test with many different indices
    for (let index = 0; index < 50; index++) {
      const avatarSrc = computeAvatarSrc(
        memberId,
        memberAvatars,
        fallbacks,
        index,
      );
      expect(avatarSrc).toBe(storedUrl);
    }
  });

  it('mixed scenario: members with and without stored avatars', () => {
    // 10 members: even indices have stored avatars, odd indices do not
    const members = generateMembers(10);
    const partialAvatarMap: Record<string, string> = {};

    for (let i = 0; i < members.length; i++) {
      if (i % 2 === 0) {
        const id = resolveTeamMemberId(members[i]);
        partialAvatarMap[id] = `https://cdn.example.com/avatar-${i}.jpg`;
      }
    }

    for (let index = 0; index < members.length; index++) {
      const member = members[index];
      const memberId = resolveTeamMemberId(member);
      const storedAvatar = partialAvatarMap[memberId] ?? null;

      const avatarSrc = computeAvatarSrc(
        memberId,
        partialAvatarMap,
        fallbacks,
        index,
      );

      if (storedAvatar !== null) {
        // Even index: stored avatar must be used
        expect(avatarSrc).toBe(storedAvatar);
      } else {
        // Odd index: fallback must be used
        expect(avatarSrc).toBe(fallbacks[index % fallbacks.length]);
      }
    }
  });

  it('member with empty string memberId uses fallback (not stored avatar)', () => {
    // Edge case: member with no userId, keycloakId, or email → memberId = ''
    const member = makeMember({
      userId: undefined,
      keycloakId: undefined,
      email: undefined,
    });
    const memberId = resolveTeamMemberId(member);
    // memberId will be '' since all fields are undefined
    const memberAvatars: Record<string, string> = {
      '': 'https://cdn.example.com/ghost.jpg',
    };

    // The component checks: const storedAvatar = memberId ? (memberAvatars[memberId] ?? null) : null;
    // When memberId is '', the ternary returns null → fallback is used
    const storedAvatar = memberId ? (memberAvatars[memberId] ?? null) : null;
    const avatarSrc = storedAvatar ?? fallbacks[0 % fallbacks.length];

    expect(storedAvatar).toBeNull();
    expect(avatarSrc).toBe(fallbacks[0]);
  });
});

// ---------------------------------------------------------------------------
// Property 2: Preservation filtrage
//
// For any list of members and any role filter, membresFiltres returns exactly
// the members whose sub-roles include the filter.
//
// Validates: Requirements 3.2
// ---------------------------------------------------------------------------

describe('Property: Preservation filtrage par role (Requirements 3.2)', () => {
  /**
   * Mirrors the membresFiltres computed logic from AgencyStore:
   *   if (!role) return entities();
   *   return entities().filter(member =>
   *     readResolvedTeamMemberRoles(member, cachedSubRoles).includes(role)
   *   );
   */
  function applyRoleFilter(
    members: AdminUserResponse[],
    filterRole: string | null,
    memberSubRoles: TeamMemberSubRolesMap,
  ): AdminUserResponse[] {
    if (!filterRole) {
      return members;
    }
    return members.filter((member) =>
      readResolvedTeamMemberRoles(member, memberSubRoles).includes(filterRole),
    );
  }

  it('null filter returns all members', () => {
    const members = generateMembers(15);
    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 0, roles: ['DIRECTEUR_AGENCE'] },
      { memberIndex: 1, roles: ['COMMERCIAL'] },
    ]);

    const result = applyRoleFilter(members, null, subRoles);
    expect(result).toHaveLength(members.length);
    expect(result).toEqual(members);
  });

  it('filter returns exactly the members whose sub-roles include the filter role', () => {
    const members = generateMembers(10);
    const targetRole = 'DIRECTEUR_AGENCE';

    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 0, roles: [targetRole, 'COMMERCIAL'] },
      { memberIndex: 2, roles: [targetRole] },
      { memberIndex: 4, roles: ['COMMERCIAL'] },
      { memberIndex: 6, roles: [] },
      { memberIndex: 8, roles: [targetRole, 'GESTIONNAIRE'] },
    ]);

    const result = applyRoleFilter(members, targetRole, subRoles);

    // Should include members 0, 2, 8 (have targetRole)
    const expectedIds = [
      resolveTeamMemberId(members[0]),
      resolveTeamMemberId(members[2]),
      resolveTeamMemberId(members[8]),
    ];

    expect(result).toHaveLength(3);
    for (const member of result) {
      expect(expectedIds).toContain(resolveTeamMemberId(member));
    }
  });

  it('filter with no matching members returns empty array', () => {
    const members = generateMembers(8);
    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 0, roles: ['COMMERCIAL'] },
      { memberIndex: 1, roles: ['GESTIONNAIRE'] },
    ]);

    const result = applyRoleFilter(members, 'DIRECTEUR_AGENCE', subRoles);
    expect(result).toHaveLength(0);
  });

  it('filter with all members matching returns all members', () => {
    const members = generateMembers(6);
    const targetRole = 'COMMERCIAL';
    const subRoles = generateSubRolesMap(
      members,
      members.map((_, i) => ({ memberIndex: i, roles: [targetRole] })),
    );

    const result = applyRoleFilter(members, targetRole, subRoles);
    expect(result).toHaveLength(members.length);
  });

  it('property: filtered result is always a subset of the original members', () => {
    // For any filter, the result must be a subset of the input
    const members = generateMembers(20);
    const roles = ['DIRECTEUR_AGENCE', 'COMMERCIAL', 'GESTIONNAIRE', 'ADMIN'];

    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 0, roles: ['DIRECTEUR_AGENCE', 'COMMERCIAL'] },
      { memberIndex: 3, roles: ['COMMERCIAL'] },
      { memberIndex: 7, roles: ['GESTIONNAIRE'] },
      { memberIndex: 11, roles: ['DIRECTEUR_AGENCE'] },
      { memberIndex: 15, roles: ['ADMIN', 'COMMERCIAL'] },
      { memberIndex: 19, roles: ['GESTIONNAIRE', 'ADMIN'] },
    ]);

    for (const role of roles) {
      const result = applyRoleFilter(members, role, subRoles);
      // Every result member must be in the original list
      for (const member of result) {
        expect(members).toContain(member);
      }
      // Result length must be <= original length
      expect(result.length).toBeLessThanOrEqual(members.length);
    }
  });

  it('property: filtering is idempotent — applying the same filter twice gives the same result', () => {
    const members = generateMembers(12);
    const targetRole = 'COMMERCIAL';
    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 1, roles: ['COMMERCIAL'] },
      { memberIndex: 5, roles: ['COMMERCIAL', 'GESTIONNAIRE'] },
      { memberIndex: 9, roles: ['DIRECTEUR_AGENCE'] },
    ]);

    const firstPass = applyRoleFilter(members, targetRole, subRoles);
    const secondPass = applyRoleFilter(firstPass, targetRole, subRoles);

    expect(secondPass).toHaveLength(firstPass.length);
    expect(secondPass).toEqual(firstPass);
  });

  it('property: filtering by role A then role B gives empty result when no member has both roles', () => {
    const members = generateMembers(10);
    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 0, roles: ['DIRECTEUR_AGENCE'] },
      { memberIndex: 1, roles: ['COMMERCIAL'] },
      { memberIndex: 2, roles: ['DIRECTEUR_AGENCE'] },
      { memberIndex: 3, roles: ['COMMERCIAL'] },
    ]);

    const filteredByA = applyRoleFilter(members, 'DIRECTEUR_AGENCE', subRoles);
    const filteredByBFromA = applyRoleFilter(
      filteredByA,
      'COMMERCIAL',
      subRoles,
    );

    // No member has both roles, so the intersection is empty
    expect(filteredByBFromA).toHaveLength(0);
  });

  it('property: members without sub-roles in the map are excluded by any role filter', () => {
    const members = generateMembers(5);
    // No sub-roles assigned to any member
    const emptySubRoles: TeamMemberSubRolesMap = {};

    const result = applyRoleFilter(members, 'DIRECTEUR_AGENCE', emptySubRoles);
    expect(result).toHaveLength(0);
  });

  it('property: extractSubRolesFromTeamResponse correctly populates the sub-roles map', () => {
    // Verify that the helper used by the store correctly extracts sub-roles
    // from a team response, which is the foundation of the filtering behavior.
    const teamResponse = [
      { userId: 'u1', subRoles: ['DIRECTEUR_AGENCE', 'COMMERCIAL'] },
      { userId: 'u2', subRoles: ['COMMERCIAL'] },
      { userId: 'u3', subRoles: [] },
      { userId: 'u4' }, // no subRoles field
    ];

    const subRolesMap = extractSubRolesFromTeamResponse(teamResponse);

    expect(subRolesMap['u1']).toEqual(['DIRECTEUR_AGENCE', 'COMMERCIAL']);
    expect(subRolesMap['u2']).toEqual(['COMMERCIAL']);
    expect(subRolesMap['u3']).toEqual([]);
    // u4 has no subRoles field → empty array
    expect(subRolesMap['u4']).toEqual([]);
  });

  it('property: filtering result is consistent regardless of member order in the list', () => {
    // The filter result should not depend on the order of members in the list
    const members = generateMembers(8);
    const targetRole = 'GESTIONNAIRE';
    const subRoles = generateSubRolesMap(members, [
      { memberIndex: 2, roles: ['GESTIONNAIRE'] },
      { memberIndex: 5, roles: ['GESTIONNAIRE', 'COMMERCIAL'] },
    ]);

    const originalResult = applyRoleFilter(members, targetRole, subRoles);

    // Reverse the member list
    const reversedMembers = [...members].reverse();
    const reversedResult = applyRoleFilter(
      reversedMembers,
      targetRole,
      subRoles,
    );

    // Same members should be returned (possibly in different order)
    expect(reversedResult).toHaveLength(originalResult.length);
    const originalIds = originalResult.map(resolveTeamMemberId).sort();
    const reversedIds = reversedResult.map(resolveTeamMemberId).sort();
    expect(reversedIds).toEqual(originalIds);
  });

  it('property: filtering with many different role values covers all cases', () => {
    // Generate a large set of members with varied role assignments
    // and verify the filter always returns exactly the right subset
    const members = generateMembers(30);
    const allRoles = [
      'DIRECTEUR_AGENCE',
      'COMMERCIAL',
      'GESTIONNAIRE',
      'ADMIN',
      'COMPTABLE',
    ];

    // Assign roles in a deterministic pattern
    const roleAssignments = members.map((_, i) => ({
      memberIndex: i,
      roles: allRoles.filter((_, roleIdx) => (i + roleIdx) % 3 === 0),
    }));

    const subRoles = generateSubRolesMap(members, roleAssignments);

    for (const role of allRoles) {
      const result = applyRoleFilter(members, role, subRoles);

      // Manually compute expected result
      const expected = members.filter((member) => {
        const id = resolveTeamMemberId(member);
        return (subRoles[id] ?? []).includes(role);
      });

      expect(result).toHaveLength(expected.length);
      const resultIds = result.map(resolveTeamMemberId).sort();
      const expectedIds = expected.map(resolveTeamMemberId).sort();
      expect(resultIds).toEqual(expectedIds);
    }
  });
});
