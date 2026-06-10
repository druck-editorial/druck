// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, test } from 'vitest';

const FIXTURES_DIR = join(import.meta.dirname, '../public/sample-data');
const REQUIRED_ARTICLE_FIELDS = ['title', 'slug', 'format', 'category', 'heroImage'] as const;

const fixtureFiles = readdirSync(FIXTURES_DIR).filter((name) => name.endsWith('.json'));

describe('sample-data fixtures', () => {
  test('directory contains fixtures', () => {
    expect(fixtureFiles.length).toBeGreaterThan(0);
  });

  for (const name of fixtureFiles) {
    test(`${name} parses as JSON`, () => {
      const raw = readFileSync(join(FIXTURES_DIR, name), 'utf8');
      expect(() => JSON.parse(raw)).not.toThrow();
    });
  }

  for (const name of fixtureFiles.filter((n) => !n.startsWith('specimen.') && n !== 'tg-posts.json')) {
    test(`${name} carries required article fields`, () => {
      const data = JSON.parse(readFileSync(join(FIXTURES_DIR, name), 'utf8'));
      const items = Array.isArray(data) ? data : [data];
      for (const item of items) {
        for (const field of REQUIRED_ARTICLE_FIELDS) {
          expect(item[field] !== undefined && item[field] !== null, `${name} missing ${field}`).toBe(true);
        }
      }
    });
  }
});
