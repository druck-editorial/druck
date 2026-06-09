import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { defineConfig } from 'vite';
import { buildLandingHtml } from './prerender/render-bands.mjs';

const FIXTURES_DIR = join(import.meta.dirname, 'public/sample-data');
const AUDIT_SUMMARY_PATH = join(import.meta.dirname, 'audit/summary.json');

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
  };
}

export default defineConfig({
  plugins: [druckPrerender()],
  server: { port: 3111 },
});
