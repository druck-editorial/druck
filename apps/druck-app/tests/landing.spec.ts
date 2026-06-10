// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { expect, test } from '@playwright/test';

test.describe('band 1 hero', () => {
  test('sequence plays to done', async ({ page }) => {
    await page.goto('/');
    const stage = page.locator('[data-island="sequence"]');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-state', 'done', { timeout: 8000 });
    await expect(stage.locator('.hx[data-step="5"]')).toHaveClass(/on/);
  });

  test('reduced motion renders the complete static state', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    const stage = page.locator('[data-island="sequence"]');
    await expect(stage).toHaveAttribute('data-state', 'static');
    await context.close();
  });
});

test.describe('band order and structure', () => {
  test('bands appear in recut order', async ({ page }) => {
    await page.goto('/');
    const classes = await page.locator('main > section').evaluateAll((els) => els.map((el) => el.className));
    expect(classes.map((c) => c.match(/band-[\w-]+/)?.[0])).toEqual(
      ['band-hero', 'band-surfaces', 'band-wild', 'band-frontpage', 'band-range', 'band-analytics', 'band-colophon']);
  });

  test('page height stays inside the budget', async ({ page }) => {
    await page.setViewportSize({ width: 1512, height: 900 });
    await page.goto('/');
    await page.waitForLoadState('networkidle');
    expect(await page.evaluate(() => document.body.scrollHeight)).toBeLessThanOrEqual(11000);
  });
});

test.describe('band wild', () => {
  test('all three frames render live shadow-dom content with their stories', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    const expectations: Array<[string, string]> = [
      ['.frame--music druck-feed', 'Glass Anatomy'],
      ['.frame--fashion druck-article', 'Uniform'],
      ['.ledgerline-site druck-feed', 'Bitcoin'],
    ];
    for (const [frame, text] of expectations) {
      const widget = page.locator(frame);
      await expect(widget).toBeVisible();
      await expect
        .poll(async () => widget.evaluate((el) => el.shadowRoot?.textContent ?? ''), { timeout: 15000 })
        .toContain(text);
    }
  });

  test('surface turns ink at band-wild and back to paper at the hero', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'IntersectionObserver 32% threshold needs desktop viewport');
    await page.goto('/');
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'paper');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'ink', { timeout: 8000 });
    await page.locator('.band-hero').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'paper', { timeout: 8000 });
  });

  test('frame viewports clip overflow and fade at the bottom', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    const el = page.locator('.frame-viewport').first();
    const overflowY = await el.evaluate((node) => getComputedStyle(node).overflowY);
    expect(overflowY).toBe('hidden');
    const clientHeight = await el.evaluate((node) => node.clientHeight);
    const viewportHeight = await page.evaluate(() => window.innerHeight);
    expect(clientHeight).toBeLessThanOrEqual(viewportHeight * 0.65);
    const afterContent = await el.evaluate((node) => getComputedStyle(node, '::after').content);
    expect(afterContent).not.toBe('none');
  });
});

test.describe('band frontpage', () => {
  test('front page renders a hero row from the prerendered light DOM', async ({ page }) => {
    await page.route('https://sonto.tech/**', (route) => route.abort());
    await page.goto('/');
    await page.locator('.band-frontpage').scrollIntoViewIfNeeded();
    await expect(page.locator('.band-frontpage .df-row--hero').first()).toBeVisible({ timeout: 10_000 });
  });

  test('front page falls back to the snapshot when sonto is unreachable', async ({ page }) => {
    await page.route('https://sonto.tech/**', (route) => route.abort());
    await page.goto('/');
    await page.locator('.band-frontpage').scrollIntoViewIfNeeded();
    await expect(page.locator('.band-frontpage .df-row--hero').first()).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('band range', () => {
  test('range switchers change format, language, and accent', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-range').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Wire' }).click();
    await page.getByRole('radio', { name: 'JA', exact: true }).click();
    await expect(page.locator('.specimen-panel[data-format="wire"][data-lang="ja"]')).toBeVisible();
    await page.getByRole('radio', { name: 'Security' }).click();
    await expect(page.locator('.range-stage')).toHaveClass(/cat-security/);
  });

  test('en + feature specimen panel is visible on initial load', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-range').scrollIntoViewIfNeeded();
    await expect(page.locator('.specimen-panel[data-format="feature"][data-lang="en"]')).toBeVisible();
  });
});

test.describe('chrome', () => {
  test('theme toggle persists across reload', async ({ page }) => {
    await page.goto('/');
    await page.locator('[data-island="theme"]').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await page.reload();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
  });

  test('theme toggle shows the active icon in each theme', async ({ page }) => {
    const toggle = page.locator('[data-island="theme"]');
    await page.goto('/');
    await expect(toggle.locator('svg.sun')).toBeVisible();
    await expect(toggle.locator('svg.moon')).toBeHidden();
    await toggle.click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark');
    await expect(toggle.locator('svg.sun')).toBeHidden();
    await expect(toggle.locator('svg.moon')).toBeVisible();
  });

  test('no horizontal scroll at 320px', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 720 });
    await page.goto('/');
    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBe(0);
  });

  test('page renders all bands with JavaScript disabled', async ({ browser }) => {
    const context = await browser.newContext({ javaScriptEnabled: false });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    await expect(page.locator('.band')).toHaveCount(7);
    await expect(page.locator('.band-hero .hero-pane-mag')).toBeVisible();
    await expect(page.locator('.tg-panel')).toBeVisible();
    await expect(page.locator('.band-frontpage .druck-front-page')).toBeVisible();
    await expect(page.locator('.specimen-panel[data-format="feature"][data-lang="en"]')).toBeVisible();
    await expect(page.locator('.band-colophon')).toBeVisible();
    await expect(page.locator('.band-colophon .colophon-signature')).toBeVisible();
    await expect(page.locator('.frame-caption').first()).toBeVisible();
    await context.close();
  });
});
