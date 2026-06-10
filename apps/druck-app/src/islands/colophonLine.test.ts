// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom
import { describe, expect, it, vi } from 'vitest';
import { initColophonLine } from './colophonLine.js';

vi.mock('@druck-editorial/analytics', () => ({
  ReadingTracker: vi.fn(),
}));

describe('initColophonLine', () => {
  it('initializes without throwing and keeps initial values', () => {
    document.body.innerHTML = `
      <main><p style="height:5000px">content</p></main>
      <p data-island="colophon-line"><span data-line="depth">0%</span><span data-line="time">0s</span></p>`;
    const el = document.querySelector<HTMLElement>('[data-island="colophon-line"]')!;
    expect(() => initColophonLine(el)).not.toThrow();
    expect(el.querySelector('[data-line="depth"]')!.textContent).toBe('0%');
  });
});
