// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
export function initSurfacesBand(): void {
  const band = document.querySelector<HTMLElement>('[data-island="surfaces-band"]');
  if (!band) return;

  const stack = band.querySelector<HTMLElement>('.surfaces-stack');
  const jsonPane = band.querySelector<HTMLElement>('.surfaces-json');
  if (!stack || !jsonPane) return;

  const sheets = [...stack.querySelectorAll<HTMLElement>('.surface-sheet')];
  const keySpans = [...jsonPane.querySelectorAll<HTMLElement>('.jl[data-key]')];

  for (const sheet of sheets) {
    const keys = (sheet.dataset.keys ?? '').split(',').filter(Boolean);
    const on = () => {
      for (const span of keySpans) {
        if (keys.includes(span.dataset.key ?? '')) span.classList.add('lit');
      }
    };
    const off = () => {
      for (const span of keySpans) span.classList.remove('lit');
    };
    sheet.addEventListener('mouseenter', on);
    sheet.addEventListener('mouseleave', off);
    sheet.addEventListener('focus', on);
    sheet.addEventListener('blur', off);
  }

  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          entry.target.classList.add('revealed');
          observer.unobserve(entry.target);
        }
      }
    },
    { threshold: 0.2 },
  );
  for (const sheet of sheets) observer.observe(sheet);
}
