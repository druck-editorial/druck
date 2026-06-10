// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
const KEY_SELECTORS = [
  '.chapter-panel',
  '.hero-stage',
  '.facts-strip',
  '.surfaces-stage',
  '.frames--top',
  '.ledgerline-pipeline',
  '.band-frontpage druck-feed',
  '.range-workspace',
  '.analytics-cards',
  '.analytics-infographic',
  '.analytics-privacy',
  '.analytics-pricing',
  '.colophon-scores',
  '.colophon-claim',
  '.colophon-snippet',
  '.colophon-method',
  '.colophon-signature',
  '.colophon-links',
];

export function initReveal(): void {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  const bands = document.querySelectorAll<HTMLElement>('.band');
  const allTargets: HTMLElement[] = [];

  for (const band of bands) {
    for (const sel of KEY_SELECTORS) {
      for (const el of band.querySelectorAll<HTMLElement>(sel)) {
        if (!allTargets.includes(el)) {
          el.classList.add('will-reveal');
          allTargets.push(el);
        }
      }
    }
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (!entry.isIntersecting) continue;
        const band = entry.target as HTMLElement;
        const targets = allTargets.filter((el) => band.contains(el) && !el.classList.contains('is-revealed'));
        targets.forEach((el, i) => {
          el.style.transitionDelay = `${i * 60}ms`;
          el.classList.add('is-revealed');
        });
        observer.unobserve(band);
      }
    },
    { rootMargin: '0px 0px -15% 0px', threshold: 0 },
  );

  for (const band of bands) {
    observer.observe(band);
  }
}
