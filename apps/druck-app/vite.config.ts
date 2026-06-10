// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFileSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { buildLandingHtml, renderDemoArticlePage } from './prerender/render-bands.mjs';
import {
  devBlog,
  fashionMagazine,
  musicReview,
  newsroom,
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

const DEMO_EMITTERS: Record<string, (dir: string) => Promise<{ slug: string; html: string }>> = {
  'music-review': musicReview,
  'fashion-magazine': fashionMagazine,
  'dev-blog': devBlog,
  newsroom,
  'telegram-brief': telegramBrief,
};

function druckPrerender() {
  return {
    name: 'druck-prerender',
    transformIndexHtml: {
      order: 'pre' as const,
      handler: (html: string) => buildLandingHtml(html, FIXTURES_DIR, readAuditSummary()),
    },
    configureServer(server: {
      middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void };
      watcher: { on: (event: string, fn: () => void) => void };
    }) {
      const pageCache = new Map<string, Promise<string>>();
      server.watcher.on('change', () => pageCache.clear());
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        let key: string | undefined;
        let render: (() => Promise<string>) | undefined;
        if (url.startsWith('/articles/quiet-revolution-small-language-models')) {
          key = 'article';
          render = () => renderDemoArticlePage(FIXTURES_DIR);
        } else {
          const slug = url.match(/^\/demos\/([\w-]+)\/?$/)?.[1];
          const emitter = slug ? DEMO_EMITTERS[slug] : undefined;
          if (slug && emitter) {
            key = slug;
            render = () => emitter(FIXTURES_DIR).then((r) => r.html);
          }
        }
        if (!key || !render) {
          next();
          return;
        }
        try {
          if (!pageCache.has(key)) pageCache.set(key, render());
          const html = await pageCache.get(key);
          res.setHeader('Content-Type', 'text/html');
          res.end(html);
        } catch {
          pageCache.delete(key);
          next();
        }
      });
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
