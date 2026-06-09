// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initEmbeds } from './embeds.js';

vi.mock('@druck/widget', () => ({}));

class FakeIntersectionObserver {
  static instances: FakeIntersectionObserver[] = [];
  callback: IntersectionObserverCallback;
  disconnect = vi.fn();
  observe = vi.fn();

  constructor(callback: IntersectionObserverCallback) {
    this.callback = callback;
    FakeIntersectionObserver.instances.push(this);
  }
}

describe('initEmbeds', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    FakeIntersectionObserver.instances.length = 0;
    vi.stubGlobal('IntersectionObserver', FakeIntersectionObserver);
    document.head.innerHTML = '';
    document.body.innerHTML = `
      <section class="band-wild">
        <druck-article data-src="/story.json"></druck-article>
      </section>`;
  });

  test('loads theme fonts and activates widgets when the band approaches', async () => {
    const appended: Node[] = [];
    vi.spyOn(document.head, 'appendChild').mockImplementation((node: Node) => {
      appended.push(node);
      return node;
    });

    const band = document.querySelector('.band-wild') as HTMLElement;
    initEmbeds(band);
    const observer = FakeIntersectionObserver.instances[0];

    observer.callback([{ isIntersecting: false } as IntersectionObserverEntry], observer as unknown as IntersectionObserver);
    expect(document.getElementById('druck-theme-fonts')).toBeNull();

    observer.callback([{ isIntersecting: true } as IntersectionObserverEntry], observer as unknown as IntersectionObserver);

    await vi.waitFor(() => expect(appended).toHaveLength(1));
    expect((appended[0] as HTMLLinkElement).id).toBe('druck-theme-fonts');
    expect(observer.disconnect).toHaveBeenCalled();
    await vi.waitFor(() => expect(document.querySelector('druck-article')?.getAttribute('src')).toBe('/story.json'));
  });
});
