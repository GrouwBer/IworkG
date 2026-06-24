import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Run tests sequentially — SQLite doesn't support parallel writes
    pool: 'forks',
    poolOptions: {
      forks: {
        singleFork: true,
      },
    },
    // Timeout for DB-heavy tests
    testTimeout: 15000,
  },
});
