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
    const button = document.createElement('button');
    initThemeToggle(button);

    button.click();
    expect(document.documentElement.dataset.theme).toBe('dark');
    expect(localStorage.getItem('druck-theme')).toBe('dark');

    button.click();
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(localStorage.getItem('druck-theme')).toBe('light');
  });
});
