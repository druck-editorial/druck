import { signal, computed } from '@preact/signals';
import type { ArticleData } from '@druck/engine';
import { renderArticle } from '@druck/engine';
import { ReadingTracker } from '@druck/analytics';

const activeSlug = signal<string>('feature');
const articles = new Map<string, { data: ArticleData; html: string }>();
const tracker = signal<ReadingTracker | null>(null);
const isTransitioning = signal(false);
const readingDepth = signal(0);
const activeReadingSec = signal(0);
const chaptersRead = signal(0);

const NAV = [
  { slug: 'feature', label: 'Feature', icon: 'M4 6h16M4 12h10M4 18h14' },
  { slug: 'wire', label: 'Wire', icon: 'M13 2L3 14h9l-1 8 10-12h-9l1-8z' },
];

const CATEGORIES = [
  { name: 'AI', color: '#8E8AD8' },
  { name: 'Security', color: '#C2513D' },
  { name: 'Dev Tools', color: '#74A889' },
  { name: 'Infrastructure', color: '#5BA6A6' },
  { name: 'Business', color: '#a67c00' },
  { name: 'Science', color: '#2c7d72' },
  { name: 'Policy', color: '#7a5a30' },
  { name: 'Weekly', color: '#4a5a6e' },
];

async function loadArticle(slug: string): Promise<void> {
  if (articles.has(slug) && activeSlug.value === slug) return;

  isTransitioning.value = true;

  await new Promise<void>((r) => setTimeout(r, 200));

  if (!articles.has(slug)) {
    const res = await fetch(`/sample-data/${slug}.json`);
    const data: ArticleData = await res.json();
    const html = renderArticle(data);
    articles.set(slug, { data, html });
  }

  activeSlug.value = slug;

  await new Promise<void>((r) => setTimeout(r, 50));
  isTransitioning.value = false;

  // Trigger fade-in animation after transition completes
  requestAnimationFrame(() => {
    const el = document.querySelector('.demo-article-content') as HTMLElement | null;
    if (el) {
      el.classList.remove('fade-in');
      void el.offsetWidth; // force reflow
      el.classList.add('fade-in');
    }
  });

  readingDepth.value = 0;
  activeReadingSec.value = 0;
  chaptersRead.value = 0;
}

function attachTracker(root: HTMLElement | null, slug: string): void {
  if (!root) return;
  tracker.value?.destroy();
  const t = new ReadingTracker(root, slug, {
    sendOn: 'manual',
    depthMilestones: [25, 50, 75, 100],
    chapterReadThresholdMs: 3000,
    onDepth: (depth: number) => { readingDepth.value = depth; },
    onActiveReading: (sec: number) => { activeReadingSec.value = sec; },
    onChapterRead: () => { chaptersRead.value = chaptersRead.value + 1; },
  });
  tracker.value = t;
}

function toggleTheme(): void {
  const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.dataset.theme = next;
  try { localStorage.setItem('druck-theme', next); } catch {}
}

function formatReadingTime(sec: number): string {
  if (sec < 60) return `${Math.round(sec)}s`;
  return `${Math.floor(sec / 60)}m ${Math.round(sec % 60)}s`;
}

const currentData = computed(() => articles.get(activeSlug.value)?.data);

export function App() {
  const current = activeSlug.value;
  const entry = articles.get(current);
  const html = entry?.html ?? '';
  const data = entry?.data;
  const transitioning = isTransitioning.value;
  const depth = readingDepth.value;
  const readSec = activeReadingSec.value;
  const chapRead = chaptersRead.value;

  const formatLabel = data?.format === 'feature' ? 'Feature' : data?.format === 'quick_take' ? 'Quick Take' : 'Wire';
  const formatColor = data?.format === 'feature' ? 'var(--demo-accent-clay)' : data?.format === 'quick_take' ? 'var(--demo-accent)' : 'var(--demo-text-muted)';

  return (
    <div class="druck-demo">
      <nav class="demo-nav" role="navigation" aria-label="Main">
        <div class="demo-nav-left">
          <span class="demo-logo">
            Dr<span class="demo-logo-accent">u</span>ck
          </span>
          <div class="demo-tabs" role="tablist">
            {NAV.map((n) => (
              <button
                role="tab"
                class={`demo-tab ${n.slug === current ? 'active' : ''}`}
                onClick={() => loadArticle(n.slug)}
                aria-selected={n.slug === current}
              >
                {n.label}
              </button>
            ))}
          </div>
        </div>
        <div class="demo-nav-right">
          {data && (
            <div class="demo-meta">
              <span>{data.chapters?.length ?? 0} chapters</span>
              <span class="demo-meta-sep" />
              <span>{data.readingTime}</span>
            </div>
          )}
          <button class="theme-btn" onClick={toggleTheme} aria-label="Toggle theme">
            <svg class="sun" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
            </svg>
            <svg class="moon" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
            </svg>
          </button>
        </div>
      </nav>

      <div class="reading-progress" aria-hidden="true"></div>

      <section class="demo-hero" aria-labelledby="demo-hero-heading">
        <div class="demo-hero-grid">
          <div class="demo-hero-text">
            <div class="demo-hero-tag">
              <span class="demo-hero-tag-dot" />
              Editorial Rendering
            </div>
            <h1 id="demo-hero-heading" class="demo-hero-h1">
              Structure in,<br /><em>magazine out</em>
            </h1>
            <p class="demo-hero-body">
              Druck takes structured article data and turns it into polished, magazine-quality web pages. Per-category accents, editorial typography, reading analytics, and embeddable widgets.
            </p>
            <div class="demo-hero-cta-row">
              <button class="demo-cta" onClick={() => document.querySelector('.demo-article-section')?.scrollIntoView({ behavior: 'smooth' })}>
                View Demo
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><polyline points="19 12 12 19 5 12"/></svg>
              </button>
              <a class="demo-cta demo-cta-ghost" href="https://github.com/druck-editorial/druck" target="_blank" rel="noopener noreferrer">
                GitHub
              </a>
            </div>
          </div>
          <div class="demo-hero-showcase">
            <div class="showcase-card">
              <div class="showcase-card-label">Format</div>
              <div class="showcase-card-value">Feature / Wire / <em>Quick Take</em></div>
              <div class="showcase-accent-bar" style={{ background: '#8E8AD8' }} />
            </div>
            <div class="showcase-card">
              <div class="showcase-card-label">Typography</div>
              <div class="showcase-card-value">5 languages, <em>per-locale</em> rules</div>
              <div class="showcase-accent-bar" style={{ background: '#74A889' }} />
            </div>
            <div class="showcase-card">
              <div class="showcase-card-label">Analytics</div>
              <div class="showcase-card-value">Chapter depth, <em>reading</em> time</div>
              <div class="showcase-accent-bar" style={{ background: 'var(--demo-accent-clay)' }} />
            </div>
            <div class="showcase-card">
              <div class="showcase-card-label">Embed</div>
              <div class="showcase-card-value">Shadow DOM, <em>scoped</em> styles</div>
              <div class="showcase-accent-bar" style={{ background: '#5BA6A6' }} />
            </div>
          </div>
        </div>
      </section>

      <div class="demo-categories" aria-label="Category accent palette">
        <div class="demo-categories-label">Category Accents</div>
        <div class="demo-categories-row">
          {CATEGORIES.map((c) => (
            <span class="demo-cat-chip" key={c.name}>
              <span class="demo-cat-dot" style={{ background: c.color }} />
              {c.name}
            </span>
          ))}
        </div>
      </div>

      <div class="demo-divider"><hr class="demo-divider-line" /></div>

      <section class="demo-article-section" aria-label="Article demo">
        <div class="demo-article-header">
          <div class="demo-article-label">Rendered Output</div>
          {data && (
            <div class="demo-format-badge" style={{ background: `${formatColor}18`, color: formatColor }}>
              {formatLabel}
            </div>
          )}
        </div>
        <div class="demo-article-frame">
          {html ? (
            <div
              class={`demo-article-content ${transitioning ? 'fade-out' : ''}`}
              ref={(el) => { if (!transitioning) attachTracker(el as HTMLElement | null, current); }}
              dangerouslySetInnerHTML={{ __html: html }}
            />
          ) : (
            <div class="demo-loading">
              <div class="demo-loading-spinner" />
              <p>Loading article...</p>
            </div>
          )}
        </div>

        <div class="demo-analytics" aria-label="Reading analytics">
          <div class="demo-analytics-title">Reading Analytics</div>
          <div class="demo-analytics-grid">
            <div class="demo-analytics-metric">
              <div class="demo-analytics-metric-label">Scroll Depth</div>
              <div class="demo-analytics-metric-value">
                {depth}<span class="demo-analytics-metric-unit">%</span>
              </div>
              <div class="demo-depth-track">
                <div class="demo-depth-fill" style={{ width: `${depth}%` }} />
              </div>
            </div>
            <div class="demo-analytics-metric">
              <div class="demo-analytics-metric-label">Active Reading</div>
              <div class="demo-analytics-metric-value">
                {formatReadingTime(readSec)}
              </div>
            </div>
            <div class="demo-analytics-metric">
              <div class="demo-analytics-metric-label">Chapters Read</div>
              <div class="demo-analytics-metric-value">
                {chapRead}<span class="demo-analytics-metric-unit">/ {data?.chapters?.length ?? '?'}</span>
              </div>
            </div>
            <div class="demo-analytics-metric">
              <div class="demo-analytics-metric-label">Format</div>
              <div class="demo-analytics-metric-value" style={{ fontSize: '18px' }}>
                {data?.format ?? '--'}
              </div>
            </div>
          </div>
        </div>
      </section>

      <div class="demo-mobile-tabs" role="tablist">
        {NAV.map((n) => (
          <button
            role="tab"
            class={`demo-mobile-tab ${n.slug === current ? 'active' : ''}`}
            onClick={() => loadArticle(n.slug)}
            aria-selected={n.slug === current}
          >
            <svg class="demo-mobile-tab-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d={n.icon} />
            </svg>
            {n.label}
          </button>
        ))}
      </div>

      <footer class="demo-footer">
        Druck — the editorial rendering layer extracted from{' '}
        <a href="https://sonto.tech" target="_blank" rel="noopener noreferrer">Sonto</a>.
        Open source under MIT.
      </footer>
    </div>
  );
}