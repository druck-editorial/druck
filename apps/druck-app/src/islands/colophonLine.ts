import { ReadingTracker } from '@druck/analytics';

export function initColophonLine(el: HTMLElement): void {
  const root = el.closest<HTMLElement>('main') ?? document.querySelector<HTMLElement>('main');
  if (!root) return;
  const depthEl = el.querySelector<HTMLElement>('[data-line="depth"]');
  const timeEl = el.querySelector<HTMLElement>('[data-line="time"]');
  new ReadingTracker(root, 'druck-landing', {
    sendOn: 'manual',
    onDepth: (depth) => { if (depthEl) depthEl.textContent = `${depth}%`; },
    onActiveReading: (sec) => { if (timeEl) timeEl.textContent = `${sec}s`; },
  });
}
