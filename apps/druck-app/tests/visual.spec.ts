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
  { name: 'formats', selector: '.band-formats' },
  { name: 'langs', selector: '.band-langs' },
  { name: 'article', selector: '.band-article' },
  { name: 'wild', selector: '.band-wild' },
  { name: 'colophon', selector: '.band-colophon' },
] as const;

const THEMES = ['light', 'dark'] as const;

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
      await page.goto('/');
      await page.addStyleTag({
        content: '.demo-nav,.reading-progress,.skip-link{visibility:hidden!important}',
      });

      for (const band of BANDS) {
        const locator = page.locator(band.selector);
        await page.evaluate((selector) => {
          document.querySelector(selector)?.scrollIntoView({ block: 'start', inline: 'nearest' });
        }, band.selector);
        await expect(locator).toHaveScreenshot(`${band.name}-${viewport.name}-${theme}.png`, {
          animations: 'disabled',
          maxDiffPixelRatio: 0.02,
          mask: [
            page.locator('[data-metric="depth"]'),
            page.locator('[data-metric="time"]'),
            page.locator('[data-metric="chapters"]'),
            page.locator('[data-metric="milestone"]'),
          ],
        });
      }
    });
  }
}
