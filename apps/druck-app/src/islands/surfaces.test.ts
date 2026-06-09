// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initSurfaces } from './surfaces.js';

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  observe = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
}

describe('initSurfaces', () => {
  beforeEach(() => {
    FakeIntersectionObserver.instances.length = 0;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    document.documentElement.dataset.surface = '';
    document.body.innerHTML = '';
  });

  test('does nothing when no ink bands exist', () => {
    initSurfaces();
    expect(FakeIntersectionObserver.instances).toHaveLength(0);
  });

  test('sets the document surface from visible ink bands', () => {
    document.body.innerHTML = '<section data-surface="ink"></section>';
    const band = document.querySelector('section') as HTMLElement;
    initSurfaces();
    const observer = FakeIntersectionObserver.instances[0];

    observer.callback([{ target: band, isIntersecting: true } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
    expect(document.documentElement.dataset.surface).toBe('ink');

    observer.callback([{ target: band, isIntersecting: false } as unknown as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
    expect(document.documentElement.dataset.surface).toBe('paper');
  });
});
