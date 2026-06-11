// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initThemeToggle } from './theme.js';

describe('initThemeToggle', () => {
  beforeEach(() => {
    const values = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => values.get(key) ?? null,
      setItem: (key: string, value: string) => values.set(key, value),
      clear: () => values.clear(),
    });
    document.documentElement.dataset.theme = '';
    localStorage.clear();
    document.body.innerHTML = '';
  });

  test('toggles and persists the document theme from a single button', () => {
    const btn = document.createElement('button');
    btn.dataset.island = 'theme';
    document.body.appendChild(btn);

    initThemeToggle();
    expect(btn.getAttribute('aria-pressed')).toBe('false');
    expect(btn.getAttribute('aria-label')).toBe('Switch to dark theme');

    btn.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('druck-theme')).toBe('dark');
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Switch to light theme');

    btn.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('druck-theme')).toBe('light');
    expect(btn.getAttribute('aria-pressed')).toBe('false');
  });

  test('reflects a dark theme already set before init', () => {
    document.documentElement.dataset.theme = 'dark';
    const btn = document.createElement('button');
    btn.dataset.island = 'theme';
    document.body.appendChild(btn);

    initThemeToggle();
    expect(btn.getAttribute('aria-pressed')).toBe('true');
    expect(btn.getAttribute('aria-label')).toBe('Switch to light theme');
  });
});
