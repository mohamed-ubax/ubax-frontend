import { describe, expect, it } from 'vitest';
import { extractAvatarUrlsFromTeamResponse } from './team-member.helpers';

describe('extractAvatarUrlsFromTeamResponse', () => {
  it('should populate the map from members with camelCase avatarUrl', () => {
    const response = {
      content: [
        { userId: 'user-1', avatarUrl: 'https://cdn.example.com/avatar1.jpg' },
        { userId: 'user-2', avatarUrl: 'https://cdn.example.com/avatar2.jpg' },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result).toEqual({
      'user-1': 'https://cdn.example.com/avatar1.jpg',
      'user-2': 'https://cdn.example.com/avatar2.jpg',
    });
  });

  it('should return an empty map when members have no avatarUrl', () => {
    const response = {
      content: [
        { userId: 'user-1', firstName: 'Alice' },
        { userId: 'user-2', firstName: 'Bob' },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result).toEqual({});
  });

  it('should populate the map from members with snake_case avatar_url', () => {
    const response = {
      content: [
        {
          userId: 'user-1',
          avatar_url: 'https://cdn.example.com/avatar1.jpg',
        },
        {
          userId: 'user-2',
          avatar_url: 'https://cdn.example.com/avatar2.jpg',
        },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result).toEqual({
      'user-1': 'https://cdn.example.com/avatar1.jpg',
      'user-2': 'https://cdn.example.com/avatar2.jpg',
    });
  });

  it('should prefer camelCase avatarUrl over snake_case avatar_url', () => {
    const response = {
      content: [
        {
          userId: 'user-1',
          avatarUrl: 'https://cdn.example.com/camel.jpg',
          avatar_url: 'https://cdn.example.com/snake.jpg',
        },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result['user-1']).toBe('https://cdn.example.com/camel.jpg');
  });

  it('should extract avatar values from alternate backend fields', () => {
    const response = {
      data: [
        {
          userId: 'user-1',
          picture: 'https://cdn.example.com/picture.jpg',
        },
        {
          userId: 'user-2',
          avatar: 'https://cdn.example.com/avatar.jpg',
        },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result).toEqual({
      'user-1': 'https://cdn.example.com/picture.jpg',
      'user-2': 'https://cdn.example.com/avatar.jpg',
    });
  });

  it('should ignore members without userId nor keycloakId', () => {
    const response = {
      content: [
        // member with no userId, no keycloakId, no email → resolveTeamMemberId returns ''
        { avatarUrl: 'https://cdn.example.com/avatar.jpg' },
        // member with userId → should be included
        {
          userId: 'user-1',
          avatarUrl: 'https://cdn.example.com/avatar1.jpg',
        },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['user-1']).toBe('https://cdn.example.com/avatar1.jpg');
  });

  it('should return an empty map for null response', () => {
    const result = extractAvatarUrlsFromTeamResponse(null);
    expect(result).toEqual({});
  });

  it('should return an empty map for undefined response', () => {
    const result = extractAvatarUrlsFromTeamResponse(undefined);
    expect(result).toEqual({});
  });

  it('should return an empty map for an empty array response', () => {
    const result = extractAvatarUrlsFromTeamResponse([]);
    expect(result).toEqual({});
  });

  it('should return an empty map for an empty content array', () => {
    const result = extractAvatarUrlsFromTeamResponse({ content: [] });
    expect(result).toEqual({});
  });

  it('should use keycloakId as key when userId is absent', () => {
    const response = {
      content: [
        {
          keycloakId: 'kc-abc',
          avatarUrl: 'https://cdn.example.com/kc-avatar.jpg',
        },
      ],
    };

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result['kc-abc']).toBe('https://cdn.example.com/kc-avatar.jpg');
  });

  it('should handle a flat array response', () => {
    const response = [
      { userId: 'user-1', avatarUrl: 'https://cdn.example.com/avatar1.jpg' },
      { userId: 'user-2', avatarUrl: 'https://cdn.example.com/avatar2.jpg' },
    ];

    const result = extractAvatarUrlsFromTeamResponse(response);

    expect(result).toEqual({
      'user-1': 'https://cdn.example.com/avatar1.jpg',
      'user-2': 'https://cdn.example.com/avatar2.jpg',
    });
  });
});
