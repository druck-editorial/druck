interface SwitcherOptions {
  datasetKey?: string;
  onChange?: (value: string) => void;
}

const NEXT_KEYS = ['ArrowRight', 'ArrowDown'];
const PREV_KEYS = ['ArrowLeft', 'ArrowUp'];

export function initSwitcher(root: HTMLElement, options: SwitcherOptions): void {
  const radios = [...root.querySelectorAll<HTMLButtonElement>('[role="radio"]')];
  if (radios.length === 0) return;

  const select = (target: HTMLButtonElement): void => {
    const value = target.dataset.value ?? '';
    for (const radio of radios) {
      radio.setAttribute('aria-checked', String(radio === target));
      radio.tabIndex = radio === target ? 0 : -1;
    }
    if (options.datasetKey) {
      const key = options.datasetKey;
      for (const panel of document.querySelectorAll<HTMLElement>(`[data-${key}]`)) {
        panel.hidden = panel.dataset[key] !== value;
      }
    }
    options.onChange?.(value);
  };

  for (const radio of radios) {
    radio.addEventListener('click', () => select(radio));
  }

  root.addEventListener('keydown', (event) => {
    const isNext = NEXT_KEYS.includes(event.key);
    const isPrev = PREV_KEYS.includes(event.key);
    if (!isNext && !isPrev) return;
    event.preventDefault();
    const current = radios.findIndex((radio) => radio.getAttribute('aria-checked') === 'true');
    const offset = isNext ? 1 : -1;
    const next = radios[(current + offset + radios.length) % radios.length];
    select(next);
    next.focus();
  });

  const initial = radios.find((radio) => radio.getAttribute('aria-checked') === 'true') ?? radios[0];
  for (const radio of radios) radio.tabIndex = radio === initial ? 0 : -1;
}
