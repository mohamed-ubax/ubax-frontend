import { resolve } from 'node:path';
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@ubax-workspace/ubax-admin-shell': resolve(__dirname, './src/index.ts'),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['libs/ubax-admin/shell/src/**/*.spec.ts'],
  },
});
