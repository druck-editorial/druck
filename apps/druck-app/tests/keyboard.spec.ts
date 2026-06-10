// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { expect, test } from '@playwright/test';

test('skip link is first tab stop and jumps to main', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  expect(page.url()).toContain('#main');
});

test('range-format radiogroup follows arrow-key semantics', async ({ page }) => {
  await page.goto('/');
  await page.locator('.band-range').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: 'Feature' }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Quick Take' })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.specimen-panel[data-format="quick_take"][data-lang="en"]')).toBeVisible();
});

test('range-lang radiogroup follows arrow-key semantics', async ({ page }) => {
  await page.goto('/');
  await page.locator('.band-range').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: 'EN', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'DE', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.specimen-panel[data-format="feature"][data-lang="de"]')).toBeVisible();
});

test('range-accent radiogroup follows arrow-key semantics', async ({ page }) => {
  await page.goto('/');
  await page.locator('.band-range').scrollIntoViewIfNeeded();
  await page.getByRole('radio', { name: 'AI', exact: true }).focus();
  await page.keyboard.press('ArrowRight');
  await expect(page.getByRole('radio', { name: 'Security', exact: true })).toHaveAttribute('aria-checked', 'true');
  await expect(page.locator('.range-stage')).toHaveClass(/cat-security/);
});

test('roving tabindex: exactly one tabIndex=0 per range radiogroup', async ({ page }) => {
  await page.goto('/');
  await page.locator('.band-range').scrollIntoViewIfNeeded();

  for (const selector of ['[data-switch="range-format"]', '[data-switch="range-lang"]', '[data-switch="range-accent"]']) {
    const focusable = await page.locator(`${selector} [role="radio"][tabindex="0"]`).count();
    expect(focusable).toBe(1);
  }
});

test('every interactive control is reachable and focusable', async ({ page }) => {
  await page.goto('/');
  const selectors = [
    '[data-island="theme"]',
    '.demo-cta',
    '[data-switch="range-format"] button',
    '[data-switch="range-lang"] button',
    '[data-switch="range-accent"] button',
  ];
  for (const selector of selectors) {
    const el = page.locator(selector).first();
    await el.focus();
    await expect(el).toBeFocused();
  }
});
