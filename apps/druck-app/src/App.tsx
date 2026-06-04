import { signal } from '@preact/signals';
import type { ArticleData } from '@druck/engine';
import { renderArticle } from '@druck/engine';
import { ReadingTracker } from '@druck/analytics';

const activeSlug = signal<string>('feature');
const articles = new Map<string, { data: ArticleData; html: string }>();
const tracker = signal<ReadingTracker | null>(null);

const NAV = [
  { slug: 'feature', label: 'Feature' },
  { slug: 'wire', label: 'Wire' },
];

async function loadArticle(slug: string): Promise<void> {
  if (articles.has(slug)) {
    activeSlug.value = slug;
    return;
  }

  const res = await fetch(`/sample-data/${slug}.json`);
  const data: ArticleData = await res.json();
  const html = renderArticle(data);
  articles.set(slug, { data, html });
  activeSlug.value = slug;
}

function attachTracker(root: HTMLElement | null, slug: string): void {
  if (!root) return;
  tracker.value?.destroy();
  const t = new ReadingTracker(root, slug, {
    sendOn: 'manual',
    depthMilestones: [25, 50, 75, 100],
    chapterReadThresholdMs: 3000,
  });
  tracker.value = t;
}

function toggleTheme(): void {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('druck-theme', next); } catch {}
}

export function App() {
  const current = activeSlug.value;
  const entry = articles.get(current);
  const html = entry?.html ?? '';
  const data = entry?.data;

  return (
    <div class="druck-demo">
      <nav class="demo-nav">
        <div class="demo-nav-left">
          <span class="demo-logo">Druck</span>
          {NAV.map((n) => (
            <button
              class={`demo-tab ${n.slug === current ? 'active' : ''}`}
              onClick={() => loadArticle(n.slug)}
            >
              {n.label}
            </button>
          ))}
        </div>
        <div class="demo-nav-right">
          {data && (
            <span class="demo-reading-info">
              {data.chapters?.length ?? 0} chapters &middot; {data.readingTime}
            </span>
          )}
          <button class="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/>
              <line x1="12" y1="1" x2="12" y2="3"/>
              <line x1="12" y1="21" x2="12" y2="23"/>
              <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
              <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
              <line x1="1" y1="12" x2="3" y2="12"/>
              <line x1="21" y1="12" x2="23" y2="12"/>
              <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
              <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
          </button>
        </div>
      </nav>

      <div class="reading-progress" aria-hidden="true"></div>

      {html ? (
        <main
          ref={(el) => attachTracker(el as HTMLElement | null, current)}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div class="demo-loading">
          <p>Loading article...</p>
        </div>
      )}
    </div>
  );
}