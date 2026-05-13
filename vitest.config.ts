import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    // Pick up both .js and .ts tests from tests/ (the previous config only
    // matched tests/**/*.test.js, which silently excluded the entire
    // tests/integration/*.test.ts suite and tests/swarm-router-sync.test.ts).
    // The tests/e2e/ folder is excluded here because those tests use
    // node:test and are run by the dedicated test:e2e:node script.
    include: ['tests/**/*.test.{js,ts}', 'packages/**/*.test.{js,ts}'],
    // Exclude folders that ship tests written for a different runner so
    // vitest doesn't try to run them and fail in confusing ways:
    //   tests/node-test/    -> node:test runner (run via test:node)
    //   tests/e2e/          -> node:test runner (run via test:e2e:node)
    //   *.spec.ts           -> Playwright (run via test:e2e)
    // Also use **/node_modules/** to catch transitively-installed test
    // files that ship inside dependency packages (zod, etc.). The plain
    // 'node_modules/**' pattern only matches the top-level dir.
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      'apps/studio/.next/**',
      'tests/e2e/**',
      'tests/node-test/**',
      'tests/**/*.spec.ts',
    ],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      // Coverage scope: production code only. Tests, configs, generated types,
      // and built artifacts never count toward the denominator.
      include: [
        'core/**/*.{js,ts}',
        'bin/**/*.{js,ts}',
        'packages/*/src/**/*.{js,ts}',
        'apps/*/src/**/*.{js,ts}',
      ],
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        'apps/studio/.next/**',
        '**/*.d.ts',
        '**/*.gen.ts',
        '**/__tests__/**',
        '**/*.test.{js,ts}',
        '**/*.spec.{js,ts}',
        'tests/**',
      ],
      // Progressive thresholds. The first PR establishes a floor; subsequent
      // work raises these toward the 50% goal across the protocol surface.
      thresholds: {
        lines: 25,
        statements: 25,
        functions: 25,
        branches: 20,
      },
    },
  },
});
