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
});
