import type { AnalyticsConfig, ReadingEvent, ReadingSession } from './types.js';

type MergedConfig = Omit<Required<AnalyticsConfig>, 'onDepth' | 'onActiveReading' | 'onChapterRead'> & {
  onDepth?: (depthPercent: number) => void;
  onActiveReading?: (activeSec: number) => void;
  onChapterRead?: (title: string) => void;
};

const DEFAULT_CONFIG: MergedConfig = {
  endpoint: '',
  sendOn: 'pagehide',
  intervalMs: 30000,
  depthMilestones: [25, 50, 75, 100],
  chapterReadThresholdMs: 3000,
  debounceMs: 100,
};

export class ReadingTracker {
  #config: MergedConfig;
  #events: ReadingEvent[] = [];
  #session: ReadingSession;
  #activeStart = 0;
  #isActive = false;
  #articleRoot: HTMLElement;
  #observer?: IntersectionObserver;
  #elementTimers = new Map<string, number>();
  #sentMilestones = new Set<number>();
  #intervalId?: ReturnType<typeof setInterval>;
  #tickId?: ReturnType<typeof setInterval>;

  constructor(articleRoot: HTMLElement, slug: string, config?: AnalyticsConfig) {
    this.#config = { ...DEFAULT_CONFIG, ...config };
    this.#articleRoot = articleRoot;
    this.#session = {
      articleSlug: slug,
      startedAt: Date.now(),
      activeReadingMs: 0,
      maxDepthPercent: 0,
      chaptersRead: [],
      keypointsViewed: [],
      asidesViewed: [],
      quotesViewed: [],
    };

    this.#observeElements();
    this.#trackActivity();
    this.#trackDepth();
    this.#setupSend();
    this.#startActiveReadingTick();
  }

  #observeElements(): void {
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const key = this.#elementKey(el);
          if (entry.isIntersecting) {
            this.#elementTimers.set(key, Date.now());
            this.#emitView(el, true);
          } else {
            this.#elementTimers.delete(key);
          }
        }
      },
      { threshold: 0.5, root: this.#articleRoot }
    );

    const selectors = [
      '.chapter-panel',
      '.key-points',
      '.article-stat',
      '.source-quote',
      '.know-cards',
    ];
    for (const sel of selectors) {
      for (const el of this.#articleRoot.querySelectorAll(sel)) {
        this.#observer.observe(el);
      }
    }
  }

  #emitView(el: HTMLElement, entering: boolean): void {
    if (!entering) return;
    const cls = el.className;
    const ev: ReadingEvent = {
      type: 'chapter_enter',
      articleSlug: this.#session.articleSlug,
      timestamp: Date.now(),
      element: cls,
    };

    if (cls.includes('chapter-panel')) {
      const title = el.querySelector('.chapter-title')?.textContent ?? '';
      ev.type = 'chapter_enter';
      ev.detail = title;
    } else if (cls.includes('key-points')) {
      ev.type = 'keypoint_view';
    } else if (cls.includes('article-stat')) {
      ev.type = 'aside_view';
      ev.detail = el.querySelector('.big')?.textContent ?? '';
    } else if (cls.includes('source-quote')) {
      ev.type = 'quote_view';
      ev.detail = el.querySelector('.q')?.textContent?.slice(0, 50) ?? '';
    } else if (cls.includes('know-cards')) {
      ev.type = 'aside_view';
    }

    this.#events.push(ev);
    this.#updateSession(ev);
  }

  #updateSession(ev: ReadingEvent): void {
    switch (ev.type) {
      case 'chapter_enter':
        if (ev.detail && !this.#session.chaptersRead.includes(ev.detail)) {
          this.#scheduleChapterRead(ev.detail);
        }
        break;
      case 'keypoint_view':
        if (ev.element && !this.#session.keypointsViewed.includes(ev.element)) {
          this.#session.keypointsViewed.push(ev.element);
        }
        break;
      case 'aside_view':
        if (ev.detail && !this.#session.asidesViewed.includes(ev.detail)) {
          this.#session.asidesViewed.push(ev.detail);
        }
        break;
      case 'quote_view':
        if (ev.detail && !this.#session.quotesViewed.includes(ev.detail)) {
          this.#session.quotesViewed.push(ev.detail);
        }
        break;
    }
  }

  #scheduleChapterRead(title: string): void {
    setTimeout(() => {
      const start = this.#elementTimers.get(`chapter-${title}`);
      if (start && Date.now() - start >= this.#config.chapterReadThresholdMs) {
        if (!this.#session.chaptersRead.includes(title)) {
          this.#session.chaptersRead.push(title);
          this.#events.push({
            type: 'chapter_read',
            articleSlug: this.#session.articleSlug,
            timestamp: Date.now(),
            detail: title,
          });
          this.#config.onChapterRead?.(title);
        }
      }
    }, this.#config.chapterReadThresholdMs);
  }

  #elementKey(el: HTMLElement): string {
    const title = el.querySelector('.chapter-title')?.textContent;
    if (title) return `chapter-${title}`;
    return `${el.className}-${el.querySelector('.big,.q,.lbl')?.textContent ?? ''}`;
  }

  #trackActivity(): void {
    const setActive = () => {
      if (!this.#isActive) {
        this.#isActive = true;
        this.#activeStart = Date.now();
      }
    };
    const setInactive = () => {
      if (this.#isActive) {
        this.#session.activeReadingMs += Date.now() - this.#activeStart;
        this.#isActive = false;
      }
    };

    document.addEventListener('scroll', setActive, { passive: true });
    document.addEventListener('click', setActive, { passive: true });
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) setInactive();
      else setActive();
    });
    window.addEventListener('pagehide', setInactive);

    const debouncedInactive = debounce(setInactive, this.#config.debounceMs);
    document.addEventListener('scroll', debouncedInactive, { passive: true });
  }

  #trackDepth(): void {
    const root = this.#articleRoot;
    const track = () => {
      const rect = root.getBoundingClientRect();
      const visibleTop = -rect.top;
      const totalScroll = rect.height - window.innerHeight;
      if (totalScroll <= 0) return;
      const depth = Math.min(100, Math.max(0, (visibleTop / totalScroll) * 100));
      this.#session.maxDepthPercent = Math.max(this.#session.maxDepthPercent, depth);
      this.#config.onDepth?.(this.#session.maxDepthPercent);

      for (const milestone of this.#config.depthMilestones) {
        if (depth >= milestone && !this.#sentMilestones.has(milestone)) {
          this.#sentMilestones.add(milestone);
          this.#events.push({
            type: 'depth_milestone',
            articleSlug: this.#session.articleSlug,
            timestamp: Date.now(),
            depthPercent: milestone,
          });
        }
      }
    };

    document.addEventListener('scroll', debounce(track, this.#config.debounceMs), { passive: true });
  }

  #setupSend(): void {
    if (this.#config.sendOn === 'pagehide') {
      window.addEventListener('pagehide', () => this.#send());
    } else if (this.#config.sendOn === 'interval') {
      this.#intervalId = setInterval(() => this.#send(), this.#config.intervalMs);
    }
  }

  #send(): void {
    if (!this.#config.endpoint || this.#events.length === 0) return;

    const payload = {
      session: this.#session,
      events: this.#events.slice(-50),
    };

    this.#events = [];

    if (navigator.sendBeacon) {
      navigator.sendBeacon(this.#config.endpoint, JSON.stringify(payload));
    } else {
      fetch(this.#config.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => {});
    }
  }

  getSession(): Readonly<ReadingSession> {
    return this.#session;
  }

  getEvents(): ReadonlyArray<ReadingEvent> {
    return this.#events;
  }

  destroy(): void {
    this.#observer?.disconnect();
    if (this.#intervalId) clearInterval(this.#intervalId);
    if (this.#tickId) clearInterval(this.#tickId);
    this.#send();
  }

  #startActiveReadingTick(): void {
    this.#tickId = setInterval(() => {
      const ms = this.#session.activeReadingMs + (this.#isActive ? Date.now() - this.#activeStart : 0);
      this.#config.onActiveReading?.(Math.round(ms / 1000));
    }, 1000);
  }
}

function debounce(fn: () => void, ms: number): () => void {
  let timer: ReturnType<typeof setTimeout>;
  return () => {
    clearTimeout(timer);
    timer = setTimeout(fn, ms);
  };
}