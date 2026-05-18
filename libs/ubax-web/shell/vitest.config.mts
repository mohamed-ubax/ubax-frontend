import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: [
      {
        find: /^@ubax-workspace\/shared-api-types\/auth-api$/,
        replacement: resolve(__dirname, '../../shared/api-types/src/auth-api.ts'),
      },
      {
        find: '@ubax-workspace/shared-api-types',
        replacement: resolve(__dirname, '../../shared/api-types/src/index.ts'),
      },
      {
        find: '@ubax-workspace/shared-data-access',
        replacement: resolve(__dirname, '../../shared/data-access/src/index.ts'),
      },
      {
        find: /^@ubax-workspace\/ubax-web-data-access\/auth-store$/,
        replacement: resolve(__dirname, '../data-access/src/lib/store/auth/auth.store.ts'),
      },
      {
        find: /^@ubax-workspace\/ubax-web-data-access\/role-access$/,
        replacement: resolve(__dirname, '../data-access/src/lib/models/role-access.model.ts'),
      },
      {
        find: '@ubax-workspace/ubax-web-data-access',
        replacement: resolve(__dirname, '../data-access/src/index.ts'),
      },
    ],
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/ubax-web/shell/src/**/*.spec.ts'],
  },
});
