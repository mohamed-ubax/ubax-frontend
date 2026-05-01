import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ubax-workspace/shared-api-types': resolve(
        __dirname,
        '../api-types/src/index.ts',
      ),
      '@ubax-workspace/shared-data-access': resolve(
        __dirname,
        './src/index.ts',
      ),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/shared/data-access/src/**/*.spec.ts'],
  },
});
