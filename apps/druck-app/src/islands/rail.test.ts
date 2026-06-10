// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initProgressRail } from './rail.js';

describe('initProgressRail', () => {
  beforeEach(() => {
    Object.defineProperty(document.documentElement, 'scrollHeight', { value: 2000, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 1000, configurable: true });
    Object.defineProperty(window, 'scrollY', { value: 250, configurable: true });
  });

  test('sets initial progress and batches scroll updates', () => {
    const callbacks: FrameRequestCallback[] = [];
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callbacks.push(callback);
      return callbacks.length;
    });

    const rail = document.createElement('div');
    initProgressRail(rail);
    expect(rail.style.transform).toBe('scaleX(0.25)');

    Object.defineProperty(window, 'scrollY', { value: 500, configurable: true });
    window.dispatchEvent(new Event('scroll'));
    window.dispatchEvent(new Event('scroll'));
    expect(callbacks).toHaveLength(1);

    callbacks[0](0);
    expect(rail.style.transform).toBe('scaleX(0.5)');
  });
});
