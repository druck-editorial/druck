// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests-unit/**/*.test.ts', 'prerender/**/*.test.mjs', 'src/**/*.test.ts'],
    environment: 'node',
    coverage: {
      provider: 'v8',
      include: ['src/islands/**/*.ts', 'prerender/**/*.mjs'],
      thresholds: { lines: 80, functions: 80 },
    },
  },
});
