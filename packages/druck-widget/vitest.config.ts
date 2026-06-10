import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: {
    alias: {
      '@druck-editorial/engine': new URL('../druck-engine/src/index.ts', import.meta.url).pathname,
    },
  },
});
