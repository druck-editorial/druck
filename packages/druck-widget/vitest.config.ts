// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@druck-editorial/engine': new URL('../druck-engine/src/index.ts', import.meta.url).pathname,
    },
  },
});
