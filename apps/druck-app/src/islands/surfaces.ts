// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
export function initSurfaces(): void {
  const inkBands = document.querySelectorAll<HTMLElement>('[data-surface="ink"]');
  if (inkBands.length === 0) return;
  const visibleInk = new Set<Element>();
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visibleInk.add(entry.target);
        else visibleInk.delete(entry.target);
      }
      document.documentElement.dataset.surface = visibleInk.size > 0 ? 'ink' : 'paper';
    },
    { threshold: 0.32 }
  );
  for (const band of inkBands) observer.observe(band);
}
