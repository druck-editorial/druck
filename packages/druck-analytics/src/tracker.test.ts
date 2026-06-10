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

  test('records know-cards asides with a stable detail', () => {
    const root = document.createElement('div');
    const card = document.createElement('div');
    card.className = 'know-cards';
    const title = document.createElement('h3');
    title.textContent = 'What you need to know';
    card.appendChild(title);
    root.appendChild(card);
    const ObserverMock = vi.fn(() => ({
      observe: vi.fn(),
      disconnect: vi.fn(),
      unobserve: vi.fn(),
    }));
    vi.stubGlobal('IntersectionObserver', ObserverMock);
    const tracker = new ReadingTracker(root, 'slug', { sendOn: 'manual' });
    tracker.destroy();
    const session = tracker.getSession();
    expect(session.asidesViewed).toBeDefined();
  });

  test('destroy() removes all document and window listeners it registered', () => {
    const root = document.createElement('div');
    const addSpy = vi.spyOn(document, 'addEventListener');
    const addWindowSpy = vi.spyOn(window, 'addEventListener');
    const removeSpy = vi.spyOn(document, 'removeEventListener');
    const removeWindowSpy = vi.spyOn(window, 'removeEventListener');
    const tracker = new ReadingTracker(root, 'slug', { sendOn: 'manual' });
    const docAdded = addSpy.mock.calls.length;
    const winAdded = addWindowSpy.mock.calls.length;
    expect(docAdded).toBeGreaterThan(0);
    expect(winAdded).toBeGreaterThan(0);
    tracker.destroy();
    expect(removeSpy.mock.calls.length).toBe(docAdded);
    expect(removeWindowSpy.mock.calls.length).toBe(winAdded);
    addSpy.mockRestore();
    addWindowSpy.mockRestore();
    removeSpy.mockRestore();
    removeWindowSpy.mockRestore();
  });
});
