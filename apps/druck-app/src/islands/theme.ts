// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>

function updateThemeButtons(theme: string): void {
  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-island="theme"]')) {
    const pressed = btn.dataset.theme === theme;
    btn.setAttribute('aria-pressed', String(pressed));
  }
}

export function initThemeToggle(): void {
  const current = document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light';
  updateThemeButtons(current);

  for (const btn of document.querySelectorAll<HTMLButtonElement>('[data-island="theme"]')) {
    btn.addEventListener('click', () => {
      const target = btn.dataset.theme === 'dark' ? 'dark' : 'light';
      document.documentElement.dataset.theme = target;
      try { localStorage.setItem('druck-theme', target); } catch {}
      updateThemeButtons(target);
    });
  }
}
