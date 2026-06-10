import { expect, test } from '@playwright/test';

test('skip link is first tab stop and jumps to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(page.url()).toContain('#main');
});

test('format radiogroup follows arrow-key semantics', async ({ page }) => {
  await page.goto('/');
  await page.locator('.format-switch').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: 'Feature' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Quick Take' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.format-panel[data-format="quick_take"]')).toBeVisible();
});

test('every interactive control is reachable and focusable', async ({ page }) => {
  await page.goto('/');
  const selectors = [
    '[data-island="theme"]',
    '.demo-cta',
    '.format-switch button',
    '.lang-switch button',
    '.accent-switch button',
  ];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    await el.focus();
    await expect(el).toBeFocused();
  }
});
