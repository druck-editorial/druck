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
const RAW_TEMPLATE_PATH = join(import.meta.dirname, 'index.html');
const DIST_INDEX_PATH = join(import.meta.dirname, 'dist/index.html');

const DEMO_ARTICLE_DIR = join(import.meta.dirname, 'dist/articles/quiet-revolution-grid-scale-batteries');
const DEMOS_BASE_DIR = join(import.meta.dirname, 'dist/demos');
const DE_LANDING_DIR = join(import.meta.dirname, 'dist/de');

function portViteAssets(deHtml: string, builtEnHtml: string): string {
  const script = builtEnHtml.match(/<script[^>]*type="module"[^>]*src="[^"]*\/assets\/[^"]+\.js"[^>]*><\/script>/)?.[0] ?? '';
  const css = builtEnHtml.match(/<link[^>]*rel="stylesheet"[^>]*href="[^"]*\/assets\/[^"]+\.css"[^>]*>/)?.[0] ?? '';
  return deHtml
    .replace(/[ \t]*<link rel="stylesheet" href="\/src\/[^"]+">\n?/g, '')
    .replace('<script type="module" src="/src/main.ts"></script>', script)
    .replace('</head>', `${css}\n</head>`);
}

function readAuditSummary(): unknown {
  try {
    return JSON.parse(readFileSync(AUDIT_SUMMARY_PATH, 'utf8'));
  } catch {
    return null;
  }
}

const DEMO_EMITTERS: Record<string, (dir: string, lang?: string) => Promise<{ slug: string; html: string }>> = {
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
      transformIndexHtml: (url: string, html: string) => Promise<string>;
    }) {
      const pageCache = new Map<string, Promise<string>>();
      server.watcher.on('change', () => pageCache.clear());
      server.middlewares.use(async (req, res, next) => {
        const url = (req.url ?? '').split('?')[0];
        let key: string | undefined;
        let render: (() => Promise<string>) | undefined;
        if (url === '/de' || url === '/de/') {
          key = 'landing:de';
          render = async () => {
            const raw = readFileSync(RAW_TEMPLATE_PATH, 'utf8');
            const de = await buildLandingHtml(raw, FIXTURES_DIR, readAuditSummary(), 'de');
            return server.transformIndexHtml('/de/', de);
          };
        } else if (url.startsWith('/articles/quiet-revolution-grid-scale-batteries')) {
          key = 'article';
          render = () => renderDemoArticlePage(FIXTURES_DIR);
        } else {
          const demoMatch = url.match(/^\/demos\/([\w-]+)(?:\/(de))?\/?$/);
          const slug = demoMatch?.[1];
          const lang = demoMatch?.[2] === 'de' ? 'de' : 'en';
          const emitter = slug ? DEMO_EMITTERS[slug] : undefined;
          if (slug && emitter) {
            key = `${slug}:${lang}`;
            render = () => emitter(FIXTURES_DIR, lang).then((r) => r.html);
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
      const builtEn = readFileSync(DIST_INDEX_PATH, 'utf8');
      const rawTemplate = readFileSync(RAW_TEMPLATE_PATH, 'utf8');
      const deLanding = await buildLandingHtml(rawTemplate, FIXTURES_DIR, readAuditSummary(), 'de');
      await mkdir(DE_LANDING_DIR, { recursive: true });
      await writeFile(join(DE_LANDING_DIR, 'index.html'), portViteAssets(deLanding, builtEn));

      await mkdir(DEMO_ARTICLE_DIR, { recursive: true });
      await writeFile(join(DEMO_ARTICLE_DIR, 'index.html'), await renderDemoArticlePage(FIXTURES_DIR));

      const demoEmitters = [musicReview, fashionMagazine, devBlog, newsroom, telegramBrief];
      const langs = ['en', 'de'] as const;
      await Promise.all(
        demoEmitters.flatMap((fn) =>
          langs.map(async (lang) => {
            const { slug, html } = await fn(FIXTURES_DIR, lang);
            const dir = lang === 'de' ? join(DEMOS_BASE_DIR, slug, 'de') : join(DEMOS_BASE_DIR, slug);
            await mkdir(dir, { recursive: true });
            await writeFile(join(dir, 'index.html'), html);
          }),
        ),
      );
    },
  };
}

export default defineConfig({
  plugins: [druckPrerender()],
  server: { port: 3111 },
});
