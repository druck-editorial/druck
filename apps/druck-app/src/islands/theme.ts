export function initThemeToggle(button: HTMLElement): void {
  button.addEventListener('click', () => {
    const next = document.documentElement.dataset.theme === 'dark' ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('druck-theme', next);
    } catch {}
  });
}
