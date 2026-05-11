import { defineConfig } from 'vitest/config';

// Vitest 4 rework: poolOptions are now top-level options.
// singleThread prevents the "Vitest failed to find the runner" race on Windows
// with Angular's in-memory virtual module provider.
export default defineConfig({
  test: {
    pool: 'vmThreads',
    singleThread: true,
  },
});
