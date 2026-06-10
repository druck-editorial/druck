import { expect, test } from '@playwright/test';

const VIEWPORTS = [
  { name: 'xs', width: 320, height: 720 },
  { name: 'sm', width: 375, height: 812 },
  { name: 'md', width: 768, height: 1024 },
  { name: 'lg', width: 1024, height: 768 },
  { name: 'xl', width: 1440, height: 900 },
] as const;

const BANDS = [
  { name: 'hero', selector: '.band-hero' },
  { name: 'wild', selector: '.band-wild' },
  { name: 'frontpage', selector: '.band-frontpage' },
  { name: 'range', selector: '.band-range' },
  { name: 'colophon', selector: '.band-colophon' },
] as const;

const THEMES = ['light', 'dark'] as const;

const DEMO_SLUGS = [
  'music-review',
  'fashion-magazine',
  'dev-blog',
  'newsroom',
  'telegram-brief',
] as const;

test.beforeEach(async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop', 'manual viewport matrix');
  await page.emulateMedia({ reducedMotion: 'reduce' });
});

for (const viewport of VIEWPORTS) {
  for (const theme of THEMES) {
    test(`bands at ${viewport.name} in ${theme}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.addInitScript((value) => {
        localStorage.setItem('druck-theme', value);
      }, theme);
      await page.route('https://sonto.tech/**', (route) => route.abort());
      await page.goto('/');
      await page.addStyleTag({
        content: '.demo-nav,.reading-progress,.skip-link{visibility:hidden!important}',
      });

      for (const band of BANDS) {
        const locator = page.locator(band.selector);
        await page.evaluate((selector) => {
          document.querySelector(selector)?.scrollIntoView({ block: 'start', inline: 'nearest' });
        }, band.selector);
        await expect(locator).toBeVisible();
        await expect(page).toHaveScreenshot(`${band.name}-${viewport.name}-${theme}.png`, {
          animations: 'disabled',
          maxDiffPixelRatio: 0.02,
          mask: [
            page.locator('[data-metric="depth"]'),
            page.locator('[data-metric="time"]'),
            page.locator('[data-metric="chapters"]'),
            page.locator('[data-metric="milestone"]'),
            page.locator('[data-line="depth"]'),
            page.locator('[data-line="time"]'),
          ],
        });
      }
    });
  }
}

for (const slug of DEMO_SLUGS) {
  for (const viewport of [
    { name: 'desktop', width: 1440, height: 900 },
    { name: 'mobile', width: 375, height: 812 },
  ] as const) {
    test(`demo ${slug} at ${viewport.name}`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'manual viewport matrix');
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.emulateMedia({ reducedMotion: 'reduce' });
      await page.goto(`/demos/${slug}/`);
      await expect(page).toHaveScreenshot(`demo-${slug}-${viewport.name}.png`, {
        animations: 'disabled',
        fullPage: true,
        maxDiffPixelRatio: 0.02,
      });
    });
  }
}
