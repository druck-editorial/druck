// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { buildLandingHtml } from './prerender/render-bands.mjs';
import {
  devBlog,
  fashionMagazine,
  musicReview,
  newsroom,
  renderDemoArticlePage,
  telegramBrief,
} from './prerender/render-demo-pages.mjs';

const FIXTURES_DIR = join(import.meta.dirname, 'public/sample-data');
const AUDIT_SUMMARY_PATH = join(import.meta.dirname, 'audit/summary.json');

const DEMO_ARTICLE_DIR = join(import.meta.dirname, 'dist/articles/quiet-revolution-small-language-models');
const DEMOS_BASE_DIR = join(import.meta.dirname, 'dist/demos');

function readAuditSummary(): unknown {
  try {
    return JSON.parse(readFileSync(AUDIT_SUMMARY_PATH, 'utf8'));
  } catch {
    return null;
  }
}

function druckPrerender() {
  return {
    name: 'druck-prerender',
    transformIndexHtml: {
      order: 'pre' as const,
      handler: (html: string) => buildLandingHtml(html, FIXTURES_DIR, readAuditSummary()),
    },
    closeBundle: async () => {
      await mkdir(DEMO_ARTICLE_DIR, { recursive: true });
      await writeFile(join(DEMO_ARTICLE_DIR, 'index.html'), await renderDemoArticlePage(FIXTURES_DIR));

      const demoEmitters = [musicReview, fashionMagazine, devBlog, newsroom, telegramBrief];
      const demoResults = await Promise.all(demoEmitters.map((fn) => fn(FIXTURES_DIR)));
      await Promise.all(
        demoResults.map(async ({ slug, html }) => {
          const dir = join(DEMOS_BASE_DIR, slug);
          await mkdir(dir, { recursive: true });
          await writeFile(join(dir, 'index.html'), html);
        }),
      );
    },
  };
}

export default defineConfig({
  plugins: [druckPrerender()],
  server: { port: 3111 },
});
