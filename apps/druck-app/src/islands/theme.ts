// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

function reflectTheme(btn: HTMLButtonElement, theme: string): void {
  const isDark = theme === 'dark';
  btn.setAttribute('aria-pressed', String(isDark));
  btn.setAttribute('aria-label', isDark ? 'Switch to light theme' : 'Switch to dark theme');
}

export function initThemeToggle(): void {
  const btn = document.querySelector<HTMLButtonElement>('[data-island="theme"]');
  if (!btn) return;

  reflectTheme(btn, document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light');

  btn.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try { localStorage.setItem('druck-theme', next); } catch {}
    reflectTheme(btn, next);
  });
}
