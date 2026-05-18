import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@ubax-workspace\/shared-api-types\/auth-api$/,
        replacement: resolve(__dirname, '../api-types/src/auth-api.ts'),
      },
      {
        find: '@ubax-workspace/shared-api-types',
        replacement: resolve(__dirname, '../api-types/src/index.ts'),
      },
      {
        find: '@ubax-workspace/shared-data-access',
        replacement: resolve(__dirname, './src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/shared/data-access/src/**/*.spec.ts'],
  },
});
