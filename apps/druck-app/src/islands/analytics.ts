// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { ReadingTracker } from '@druck-editorial/analytics';

export function initAnalytics(el: HTMLElement): void {
  const root = el.closest<HTMLElement>('main') ?? document.querySelector<HTMLElement>('main');
  if (!root) return;

  const depthEl = el.querySelector<HTMLElement>('[data-analytics="depth"]');
  const depthBarEl = el.querySelector<HTMLElement>('[data-analytics="depth-bar"]');
  const timeEl = el.querySelector<HTMLElement>('[data-analytics="time"]');
  const chaptersEl = el.querySelector<HTMLElement>('[data-analytics="chapters"]');
  const dotsEl = el.querySelector<HTMLElement>('[data-analytics="dots"]');
  const dots = dotsEl ? ([...dotsEl.children] as HTMLElement[]) : [];

  const formatTime = (sec: number): string => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  let tracker: ReadingTracker;

  const updateChapters = (): void => {
    const session = tracker.getSession();
    const count = session.chaptersRead.length;
    if (chaptersEl) chaptersEl.textContent = `${count}/${dots.length}`;
    for (let i = 0; i < dots.length; i++) {
      dots[i].classList.toggle('is-read', i < count);
    }
  };

  tracker = new ReadingTracker(root, 'druck-landing', {
    sendOn: 'manual',
    onDepth: (depth) => {
      if (depthEl) depthEl.textContent = `${Math.round(depth)}%`;
      if (depthBarEl) depthBarEl.style.width = `${Math.round(depth)}%`;
    },
    onActiveReading: (sec) => {
      if (timeEl) timeEl.textContent = formatTime(sec);
    },
    onChapterRead: () => {
      updateChapters();
    },
  });

  updateChapters();
}
