import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: '@ubax-workspace/ubax-web-data-access/team-member',
        replacement: resolve(
          __dirname,
          '../../data-access/src/lib/store/team/team-member.helpers.ts',
        ),
      },
      {
        find: '@ubax-workspace/shared-api-types',
        replacement: resolve(
          __dirname,
          '../../shared/api-types/src/index.ts',
        ),
      },
      {
        find: '@ubax-workspace/shared-data-access',
        replacement: resolve(
          __dirname,
          '../../shared/data-access/src/index.ts',
        ),
      },
      {
        find: '@ubax-workspace/ubax-web-data-access',
        replacement: resolve(
          __dirname,
          '../../data-access/src/index.ts',
        ),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/ubax-web/features/equipe/src/**/*.spec.ts'],
  },
});
