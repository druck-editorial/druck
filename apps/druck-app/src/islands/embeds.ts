const THEME_FONTS_ID = 'druck-theme-fonts';
const FEED_DEFERRED_ATTRS = ['fallback-src', 'layout', 'css-url', 'src'];

function toDatasetKey(attr: string): string {
  return attr.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase());
}

async function activate(band: HTMLElement): Promise<void> {
  if (!document.getElementById(THEME_FONTS_ID)) {
    const link = document.createElement('link');
    link.id = THEME_FONTS_ID;
    link.rel = 'stylesheet';
    link.href = new URL('../styles/fonts-themes.css', import.meta.url).href;
    document.head.appendChild(link);
  }
  await import('@druck/widget');
  for (const widget of band.querySelectorAll<HTMLElement>('druck-article[data-src]')) {
    widget.setAttribute('src', widget.dataset.src ?? '');
  }
  for (const widget of band.querySelectorAll<HTMLElement>('druck-feed[data-src]')) {
    for (const attr of FEED_DEFERRED_ATTRS) {
      const value = widget.dataset[toDatasetKey(attr)];
      if (value != null) widget.setAttribute(attr, value);
    }
  }
}

export function initEmbeds(band: HTMLElement): void {
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      void activate(band);
    },
    { rootMargin: '600px 0px' }
  );
  observer.observe(band);
}
