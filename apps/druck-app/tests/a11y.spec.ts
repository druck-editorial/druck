// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

for (const theme of ['light', 'dark'] as const) {
  test(`axe finds no violations in ${theme} theme`, async ({ page }) => {
    await page.addInitScript((value) => {
      localStorage.setItem('druck-theme', value);
    }, theme);
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto('/');
    await page.locator('.band-colophon').scrollIntoViewIfNeeded();
    await page.locator('.band-hero').scrollIntoViewIfNeeded();
    const results = await new AxeBuilder({ page }).analyze();
    expect(results.violations).toEqual([]);
  });
}
