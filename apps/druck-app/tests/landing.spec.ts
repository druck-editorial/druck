import { expect, test } from '@playwright/test';

test.describe('band 1 transformation', () => {
  test('sequence plays to done and replay restarts it', async ({ page }) => {
    await page.goto('/');
    const stage = page.locator('[data-island="sequence"]');
    await stage.scrollIntoViewIfNeeded();
    await expect(stage).toHaveAttribute('data-state', 'done', { timeout: 8000 });
    await expect(stage.locator('.hx[data-step="5"]')).toHaveClass(/on/);
    const replay = stage.locator('[data-role="replay"]');
    await expect(replay).toBeVisible();
    await replay.click();
    await expect(stage).toHaveAttribute('data-state', 'playing');
    await expect(stage).toHaveAttribute('data-state', 'done', { timeout: 8000 });
  });

  test('reduced motion renders the complete static state', async ({ browser }) => {
    const context = await browser.newContext({ reducedMotion: 'reduce' });
    const page = await context.newPage();
    await page.goto('http://localhost:4173/');
    const stage = page.locator('[data-island="sequence"]');
    await expect(stage).toHaveAttribute('data-state', 'static');
    await expect(stage.locator('[data-role="replay"]')).toBeHidden();
    await context.close();
  });
});

test.describe('band 2 formats', () => {
  test('switching format swaps panel and caption', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-formats').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Wire' }).click();
    await expect(page.locator('.format-panel[data-format="wire"]')).toBeVisible();
    await expect(page.locator('.format-panel[data-format="feature"]')).toBeHidden();
    await expect(page.locator('.format-caption[data-format="wire"]')).toBeVisible();
    await expect(page.locator('.format-panel[data-format="wire"] .post-simple')).toBeVisible();
  });

  test('format panels expand into the page without nested scrolling', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-formats').scrollIntoViewIfNeeded();

    for (const label of ['Feature', 'Quick Take', 'Wire']) {
      await page.getByRole('radio', { name: label }).click();
      const metrics = await page.locator('.format-panel:visible').evaluate((panel) => {
        const stage = panel.closest('.format-stage');
        return {
          panelOverflowY: getComputedStyle(panel).overflowY,
          panelClientHeight: panel.clientHeight,
          panelScrollHeight: panel.scrollHeight,
          stageOverflow: stage ? getComputedStyle(stage).overflow : '',
        };
      });
      expect(metrics.panelOverflowY).toBe('visible');
      expect(metrics.stageOverflow).toBe('visible');
      expect(metrics.panelScrollHeight).toBe(metrics.panelClientHeight);
    }
  });

  test('serves the supplied SLM hero at high enough fidelity', async ({ page }) => {
    const response = await page.request.get('/img/slm-hero.webp');
    expect(response.ok()).toBe(true);
    expect((await response.body()).byteLength).toBeGreaterThan(500_000);
  });
});

test.describe('band 3 languages', () => {
  test('language chips swap specimens with correct lang attribute', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-langs').scrollIntoViewIfNeeded();
    await page.locator('.lang-switch').getByRole('radio', { name: 'DE', exact: true }).click();
    const german = page.locator('.specimen-panel[lang="de"]');
    await expect(german).toBeVisible();
    await expect(german).toContainText('Sicherheitslückenausnutzung');
    await expect(page.locator('.specimen-panel[lang="en"]')).toBeHidden();
  });
});

test.describe('band 4 article, accents, analytics', () => {
  test('article is prerendered into the HTML before JS', async ({ page }) => {
    const response = await page.request.get('/');
    const html = await response.text();
    expect(html).toContain('article-shell');
    expect(html).toContain('The Quiet');
  });

  test('accent chip recolors the article shell', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-article').scrollIntoViewIfNeeded();
    await page.getByRole('radio', { name: 'Security' }).click();
    await expect(page.locator('.band4-article .article-shell')).toHaveClass(/cat-security/);
  });

  test('reading the article moves the analytics metrics', async ({ page }) => {
    await page.goto('/');
    const article = page.locator('.band4-article');
    await article.scrollIntoViewIfNeeded();
    await page.mouse.wheel(0, 900);
    await expect(page.locator('[data-metric="depth"]')).not.toHaveText('0', { timeout: 8000 });
  });

  test('live article expands into the page without nested scrolling', async ({ page }) => {
    await page.goto('/');
    const metrics = await page.locator('.band4-article').evaluate((panel) => ({
      overflowY: getComputedStyle(panel).overflowY,
      clientHeight: panel.clientHeight,
      scrollHeight: panel.scrollHeight,
    }));
    expect(metrics.overflowY).toBe('visible');
    expect(metrics.scrollHeight).toBe(metrics.clientHeight);
  });
});

test.describe('band 5 widgets in the wild', () => {
  test('all four frames render live shadow-dom articles with their stories', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    const expectations: Array<[string, string]> = [
      ['.frame--music', 'Glass Anatomy'],
      ['.frame--fashion', 'Uniform'],
      ['.frame--tech', 'Claude'],
      ['.frame--markets', 'Bitcoin'],
    ];
    for (const [frame, text] of expectations) {
      const widget = page.locator(`${frame} druck-article`);
      await expect(widget).toBeVisible();
      await expect
        .poll(async () => widget.evaluate((el) => el.shadowRoot?.textContent ?? ''), { timeout: 15000 })
        .toContain(text);
    }
  });

  test('surface turns ink at band 5 and back to paper at the hero', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'ink');
    await page.locator('.band-hero').scrollIntoViewIfNeeded();
    await expect(page.locator('html')).toHaveAttribute('data-surface', 'paper');
  });

  test('publication frames expand into the page without nested scrolling', async ({ page }) => {
    await page.goto('/');
    await page.locator('.band-wild').scrollIntoViewIfNeeded();
    const frames = await page.locator('.frame-viewport').evaluateAll((panels) => {
      return panels.map((panel) => ({
        overflowY: getComputedStyle(panel).overflowY,
        clientHeight: panel.clientHeight,
        scrollHeight: panel.scrollHeight,
      }));
    });
    for (const metrics of frames) {
      expect(metrics.overflowY).toBe('visible');
      expect(metrics.scrollHeight).toBe(metrics.clientHeight);
    }
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
    await expect(page.locator('.band')).toHaveCount(6);
    await expect(page.locator('.band4-article .article-shell')).toBeVisible();
    await context.close();
  });
});
