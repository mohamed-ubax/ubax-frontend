import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ubax-workspace/shared-api-types': resolve(
        __dirname,
        '../../shared/api-types/src/index.ts',
      ),
      '@ubax-workspace/shared-data-access': resolve(
        __dirname,
        '../../shared/data-access/src/index.ts',
      ),
      '@ubax-workspace/ubax-web-data-access': resolve(
        __dirname,
        './src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/ubax-web/data-access/src/**/*.spec.ts'],
  },
});
