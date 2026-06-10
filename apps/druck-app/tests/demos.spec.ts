import { expect, test } from '@playwright/test';

const DEMOS = [
  { slug: 'music-review', contentString: 'Glass Anatomy', hasFrontPage: true },
  { slug: 'fashion-magazine', contentString: 'Quiet Authority', hasFrontPage: true },
  { slug: 'dev-blog', contentString: 'Claude 4.6', hasFrontPage: true },
  { slug: 'newsroom', contentString: 'Northwind', hasFrontPage: true },
  { slug: 'telegram-brief', contentStrings: ['LEDGERLINE', 'druck does not import Telegram'], hasFrontPage: true },
] as const;

for (const demo of DEMOS) {
  test.describe(`demo: ${demo.slug}`, () => {
    test('responds 200', async ({ page }) => {
      const response = await page.goto(`/demos/${demo.slug}/`);
      expect(response?.status()).toBe(200);
    });

    test('contains rendered article content', async ({ page }) => {
      await page.goto(`/demos/${demo.slug}/`);
      const html = await page.content();
      if ('contentStrings' in demo) {
        for (const str of demo.contentStrings) {
          expect(html).toContain(str);
        }
      } else {
        expect(html).toContain(demo.contentString);
      }
    });

    test('attribution strip is visible and links to /', async ({ page }) => {
      await page.goto(`/demos/${demo.slug}/`);
      const attribution = page.locator('.druck-attribution');
      await expect(attribution).toBeVisible();
      await expect(attribution).toHaveAttribute('href', '/');
    });

    test('no __DRUCK_ residue in HTML', async ({ page }) => {
      await page.goto(`/demos/${demo.slug}/`);
      const html = await page.content();
      expect(html).not.toContain('__DRUCK_');
    });

    test('has noindex robots meta', async ({ page }) => {
      await page.goto(`/demos/${demo.slug}/`);
      const content = await page.locator('meta[name="robots"]').getAttribute('content');
      expect(content).toBe('noindex');
    });

    if (demo.hasFrontPage) {
      test('front page is present with at least 6 cards', async ({ page }) => {
        await page.goto(`/demos/${demo.slug}/`);
        await expect(page.locator('.druck-front-page').first()).toBeVisible();
        const cardCount = await page.locator('.druck-card, .df-hero-card').count();
        expect(cardCount).toBeGreaterThanOrEqual(6);
      });
    }
  });
}
