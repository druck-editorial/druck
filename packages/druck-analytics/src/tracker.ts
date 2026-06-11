// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import type { AnalyticsConfig, ReadingEvent, ReadingSession } from './types.js';

type MergedConfig = Omit<Required<AnalyticsConfig>, 'onDepth' | 'onActiveReading' | 'onChapterRead' | 'siteToken'> & {
  siteToken?: string;
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
  root: null,
};

const VISIBILITY_THRESHOLDS = Array.from({ length: 21 }, (_, i) => i / 20);
const VISIBLE_COVERAGE = 0.5;

export class ReadingTracker {
  #config: MergedConfig;
  #events: ReadingEvent[] = [];
  #session: ReadingSession;
  #activeStart = 0;
  #isActive = false;
  #articleRoot: HTMLElement;
  #observer?: IntersectionObserver;
  #visibility = new Map<string, { accumulatedMs: number; enteredAt: number | null }>();
  #sentMilestones = new Set<number>();
  #intervalId?: ReturnType<typeof setInterval>;
  #tickId?: ReturnType<typeof setInterval>;
  #chapterTimers = new Map<string, ReturnType<typeof setTimeout>>();
  #trackedListeners: Array<{ target: EventTarget; type: string; fn: EventListener; options?: AddEventListenerOptions | boolean }> = [];

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

  #coverage(entry: IntersectionObserverEntry): number {
    const rootHeight = entry.rootBounds?.height ?? (typeof window !== 'undefined' ? window.innerHeight : 0);
    const reference = Math.max(1, Math.min(entry.boundingClientRect.height, rootHeight));
    return entry.intersectionRect.height / reference;
  }

  #observeElements(): void {
    this.#observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const el = entry.target as HTMLElement;
          const key = this.#elementKey(el);
          const isVisible = entry.isIntersecting && this.#coverage(entry) >= VISIBLE_COVERAGE;
          const state = this.#visibility.get(key) ?? { accumulatedMs: 0, enteredAt: null };
          if (isVisible && state.enteredAt === null) {
            state.enteredAt = Date.now();
            this.#visibility.set(key, state);
            this.#emitView(el, true);
          } else if (!isVisible && state.enteredAt !== null) {
            state.accumulatedMs += Date.now() - state.enteredAt;
            state.enteredAt = null;
            const pending = this.#chapterTimers.get(key);
            if (pending) {
              clearTimeout(pending);
              this.#chapterTimers.delete(key);
            }
          }
        }
      },
      { threshold: VISIBILITY_THRESHOLDS, root: this.#config.root }
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
      ev.detail = el.querySelector('h3, h4, .kc-title, .know-title')?.textContent?.trim() || 'know-cards';
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

  #visibleMs(key: string): number {
    const state = this.#visibility.get(key);
    if (!state) return 0;
    return state.accumulatedMs + (state.enteredAt !== null ? Date.now() - state.enteredAt : 0);
  }

  #scheduleChapterRead(title: string): void {
    const key = `chapter-${title}`;
    if (this.#chapterTimers.has(key)) return;
    const remaining = Math.max(0, this.#config.chapterReadThresholdMs - this.#visibleMs(key));
    const handle = setTimeout(() => {
      this.#chapterTimers.delete(key);
      this.#markChapterRead(title);
    }, remaining);
    this.#chapterTimers.set(key, handle);
  }

  #markChapterRead(title: string): void {
    if (this.#session.chaptersRead.includes(title)) return;
    if (this.#visibleMs(`chapter-${title}`) < this.#config.chapterReadThresholdMs) return;
    this.#session.chaptersRead.push(title);
    this.#events.push({
      type: 'chapter_read',
      articleSlug: this.#session.articleSlug,
      timestamp: Date.now(),
      detail: title,
    });
    this.#config.onChapterRead?.(title);
  }

  #elementKey(el: HTMLElement): string {
    const title = el.querySelector('.chapter-title')?.textContent;
    if (title) return `chapter-${title}`;
    return `${el.className}-${el.querySelector('.big,.q,.lbl')?.textContent ?? ''}`;
  }

  #addListener(target: EventTarget, type: string, fn: EventListener, options?: AddEventListenerOptions | boolean): void {
    target.addEventListener(type, fn, options);
    this.#trackedListeners.push({ target, type, fn, options });
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

    this.#addListener(document, 'scroll', setActive as EventListener, { passive: true });
    this.#addListener(document, 'click', setActive as EventListener, { passive: true });
    this.#addListener(document, 'visibilitychange', (() => {
      if (document.hidden) setInactive();
      else setActive();
    }) as EventListener);
    this.#addListener(window, 'pagehide', setInactive as EventListener);

    const debouncedInactive = debounce(setInactive, this.#config.debounceMs);
    this.#addListener(document, 'scroll', debouncedInactive as EventListener, { passive: true });
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

    this.#addListener(document, 'scroll', debounce(track, this.#config.debounceMs) as EventListener, { passive: true });
  }

  #setupSend(): void {
    if (this.#config.sendOn === 'pagehide') {
      this.#addListener(window, 'pagehide', () => this.#send());
    } else if (this.#config.sendOn === 'interval') {
      this.#intervalId = setInterval(() => this.#send(), this.#config.intervalMs);
    }
  }

  #send(): void {
    if (!this.#config.endpoint || this.#events.length === 0) return;

    const payload = {
      session: this.#session,
      events: this.#events.slice(-50),
      ...(this.#config.siteToken ? { siteToken: this.#config.siteToken } : {}),
    };

    this.#events = [];

    const headers: Record<string, string> = { 'content-type': 'application/json' };
    if (this.#config.siteToken) {
      headers['x-druck-site'] = this.#config.siteToken;
    }

    if (navigator.sendBeacon) {
      const blob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
      navigator.sendBeacon(this.#config.endpoint, blob);
    } else {
      fetch(this.#config.endpoint, {
        method: 'POST',
        body: JSON.stringify(payload),
        headers,
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
    for (const handle of this.#chapterTimers.values()) clearTimeout(handle);
    this.#chapterTimers.clear();
    for (const { target, type, fn, options } of this.#trackedListeners) {
      target.removeEventListener(type, fn, options);
    }
    this.#trackedListeners = [];
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