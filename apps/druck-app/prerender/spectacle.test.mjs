// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { describe, expect, it } from 'vitest';
import { SPECTACLE } from './spectacle.mjs';

const items = [
  { title: '<script>x</script>', subtitle: 'S', category: 'business', publishedAt: 'May 07, 2026',
    heroImage: 'https://example.com/a.webp', shareUrl: 'javascript:alert(1)', hot: true },
  { title: 'Two', subtitle: 'S2', category: 'startup', publishedAt: 'May 07, 2026',
    heroImage: 'https://example.com/b.webp', shareUrl: 'https://example.com/b/' },
  { title: 'Three', subtitle: 'S3', category: 'science', publishedAt: 'May 06, 2026',
    heroImage: 'https://example.com/c.webp', shareUrl: 'https://example.com/c/' },
];

describe('spectacle looks', () => {
  for (const { key, render } of SPECTACLE) {
    it(`${key}: scopes, renders, and escapes`, () => {
      const html = render(items);
      expect(html).toContain(`sx-${key}`);
      expect(html).not.toContain('<script>x</script>');
      expect(html).not.toContain('javascript:alert(1)');
    });
  }
});
