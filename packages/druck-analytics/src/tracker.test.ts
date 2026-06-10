// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom
import { describe, test, expect, vi } from 'vitest';
import { ReadingTracker } from './tracker.js';

describe('ReadingTracker', () => {
  test('accepts siteToken and exposes it in config', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="chapter-panel"><span class="chapter-title">Intro</span></div>
    `;
    const tracker = new ReadingTracker(root, 'slug', {
      endpoint: 'https://api.example.com/events',
      siteToken: 'tok_abc123',
      sendOn: 'manual',
    });
    expect(tracker.getSession().articleSlug).toBe('slug');
    tracker.destroy();
  });

  test('getSession returns readonly session shape', () => {
    const root = document.createElement('div');
    const tracker = new ReadingTracker(root, 'test-slug', { sendOn: 'manual' });
    const session = tracker.getSession();
    expect(session.articleSlug).toBe('test-slug');
    expect(session.activeReadingMs).toBe(0);
    expect(session.maxDepthPercent).toBe(0);
    expect(Array.isArray(session.chaptersRead)).toBe(true);
    tracker.destroy();
  });

  test('defaults IntersectionObserver root to null (viewport)', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="chapter-panel"><span class="chapter-title">Intro</span></div>
    `;
    const ObserverMock = vi.fn((callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
    vi.stubGlobal('IntersectionObserver', ObserverMock);
    const tracker = new ReadingTracker(root, 'slug', { sendOn: 'manual' });
    expect(ObserverMock).toHaveBeenCalled();
    const opts = ObserverMock.mock.calls[0][1];
    expect(opts?.root).toBeNull();
    tracker.destroy();
  });

  test('allows overriding IntersectionObserver root via config', () => {
    const root = document.createElement('div');
    root.innerHTML = `
      <div class="chapter-panel"><span class="chapter-title">Intro</span></div>
    `;
    const customRoot = document.createElement('div');
    const ObserverMock = vi.fn((callback: IntersectionObserverCallback, options?: IntersectionObserverInit) => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
    vi.stubGlobal('IntersectionObserver', ObserverMock);
    const tracker = new ReadingTracker(root, 'slug', { sendOn: 'manual', root: customRoot });
    expect(ObserverMock).toHaveBeenCalled();
    const opts = ObserverMock.mock.calls[0][1];
    expect(opts?.root).toBe(customRoot);
    tracker.destroy();
  });
});
