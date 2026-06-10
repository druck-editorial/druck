import { ReadingTracker } from '@druck/analytics';

const MILESTONES = [25, 50, 75, 100];

function formatReadingTime(totalSeconds: number): string {
  if (totalSeconds < 60) return `${Math.round(totalSeconds)}s`;
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}m ${seconds}s`;
}

export function initAnalyticsPanel(articleRoot: HTMLElement): void {
  const metric = (name: string): HTMLElement | null =>
    document.querySelector(`[data-metric="${name}"]`);
  const announced = new Set<number>();
  let chaptersRead = 0;

  new ReadingTracker(articleRoot, 'landing-demo', {
    sendOn: 'manual',
    depthMilestones: MILESTONES,
    onDepth: (depth) => {
      const depthEl = metric('depth');
      if (depthEl) depthEl.textContent = String(depth);
      const fill = metric('depth-fill');
      if (fill) fill.style.width = `${depth}%`;
      const milestone = MILESTONES.filter((m) => depth >= m).at(-1);
      if (milestone === undefined || announced.has(milestone)) return;
      announced.add(milestone);
      const milestoneEl = metric('milestone');
      if (milestoneEl) milestoneEl.textContent = `${milestone}%`;
      const announcer = metric('announcer');
      if (announcer) announcer.textContent = `Reading depth ${milestone} percent`;
    },
    onActiveReading: (seconds) => {
      const timeEl = metric('time');
      if (timeEl) timeEl.textContent = formatReadingTime(seconds);
    },
    onChapterRead: () => {
      chaptersRead += 1;
      const chaptersEl = metric('chapters');
      if (chaptersEl) chaptersEl.textContent = String(chaptersRead);
    },
  });
}

export { formatReadingTime };
