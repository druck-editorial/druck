// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initAnalyticsPanel, formatReadingTime } from './analyticsPanel.js';

const trackerCalls = vi.hoisted(() => [] as Array<{ root: HTMLElement; id: string; options: any }>);

vi.mock('@druck/analytics', () => ({
  ReadingTracker: vi.fn((root: HTMLElement, id: string, options: any) => {
    trackerCalls.push({ root, id, options });
  }),
}));

describe('formatReadingTime', () => {
  test('formats seconds and minute values', () => {
    expect(formatReadingTime(44.4)).toBe('44s');
    expect(formatReadingTime(125.2)).toBe('2m 5s');
  });
});

describe('initAnalyticsPanel', () => {
  beforeEach(() => {
    trackerCalls.length = 0;
    document.body.innerHTML = `
      <article id="story"></article>
      <span data-metric="depth"></span>
      <span data-metric="depth-fill"></span>
      <span data-metric="milestone"></span>
      <span data-metric="announcer"></span>
      <span data-metric="time"></span>
      <span data-metric="chapters"></span>`;
  });

  test('updates metrics from tracker callbacks', () => {
    const story = document.querySelector('#story') as HTMLElement;
    initAnalyticsPanel(story);

    expect(trackerCalls[0].root).toBe(story);
    expect(trackerCalls[0].id).toBe('landing-demo');

    trackerCalls[0].options.onDepth(50);
    expect(document.querySelector('[data-metric="depth"]')?.textContent).toBe('50');
    expect((document.querySelector('[data-metric="depth-fill"]') as HTMLElement).style.width).toBe('50%');
    expect(document.querySelector('[data-metric="milestone"]')?.textContent).toBe('50%');
    expect(document.querySelector('[data-metric="announcer"]')?.textContent).toBe('Reading depth 50 percent');

    trackerCalls[0].options.onActiveReading(72);
    expect(document.querySelector('[data-metric="time"]')?.textContent).toBe('1m 12s');

    trackerCalls[0].options.onChapterRead();
    trackerCalls[0].options.onChapterRead();
    expect(document.querySelector('[data-metric="chapters"]')?.textContent).toBe('2');
  });
});
