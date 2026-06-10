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
  });

  test('toggles and persists the document theme', () => {
    const light = document.createElement('button');
    light.dataset.island = 'theme';
    light.dataset.theme = 'light';
    document.body.appendChild(light);

    const dark = document.createElement('button');
    dark.dataset.island = 'theme';
    dark.dataset.theme = 'dark';
    document.body.appendChild(dark);

    initThemeToggle();

    dark.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('druck-theme')).toBe('dark');
    expect(dark.getAttribute('aria-pressed')).toBe('true');
    expect(light.getAttribute('aria-pressed')).toBe('false');

    light.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('druck-theme')).toBe('light');
    expect(light.getAttribute('aria-pressed')).toBe('true');
    expect(dark.getAttribute('aria-pressed')).toBe('false');

    light.remove();
    dark.remove();
  });
});
