// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import copyIcon from './icons/copy.svg?raw';
import { initLang } from './i18n/translations.js';
import { initThemeToggle } from './islands/theme.js';
import { initCopyButton } from './islands/copy.js';
import { initProgressRail } from './islands/rail.js';
import { initSequence } from './islands/sequence.js';
import { initSwitcher } from './islands/switcher.js';
import { initSurfaces } from './islands/surfaces.js';
import { initSurfacesBand } from './islands/surfacesBand.js';
import { initEmbeds } from './islands/embeds.js';
import { initLedgerline } from './islands/ledgerline.js';
import { initAnalytics } from './islands/analytics.js';
import { initReveal } from './islands/reveal.js';

document.documentElement.classList.add('js');

const ICONS: Record<string, string> = {
  copy: copyIcon,
};

for (const slot of document.querySelectorAll<HTMLElement>('.icon-slot[data-icon]')) {
  slot.innerHTML = ICONS[slot.dataset.icon ?? ''] ?? '';
}

initThemeToggle();
initLang();

for (const button of document.querySelectorAll<HTMLElement>('[data-island="copy"]')) {
  initCopyButton(button);
}

const rail = document.querySelector<HTMLElement>('[data-island="rail"]');
if (rail) initProgressRail(rail);

const stage = document.querySelector<HTMLElement>('[data-island="sequence"]');
if (stage) initSequence(stage);

const rangeStage = document.querySelector<HTMLElement>('.range-stage');
const rangePanels = rangeStage ? [...rangeStage.querySelectorAll<HTMLElement>('.specimen-panel')] : [];
const rangeState = {
  format: 'feature',
  lang: 'en',
  accent: rangeStage?.className.match(/\bcat-[\w-]+\b/)?.[0] ?? 'cat-ai',
};
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

let exitTimer: ReturnType<typeof setTimeout> | null = null;
let enterTimer: ReturnType<typeof setTimeout> | null = null;

function applyRange(): void {
  const target = rangePanels.find((p) => p.dataset.format === rangeState.format && p.dataset.lang === rangeState.lang);
  const current = rangePanels.find((p) => !p.hidden);
  if (!target || target === current) return;

  if (reducedMotion) {
    if (exitTimer) { clearTimeout(exitTimer); exitTimer = null; }
    if (enterTimer) { clearTimeout(enterTimer); enterTimer = null; }
    for (const panel of rangePanels) {
      panel.hidden = panel !== target;
      panel.classList.remove('is-exiting', 'is-entering');
    }
    return;
  }

  if (exitTimer) { clearTimeout(exitTimer); exitTimer = null; }
  if (enterTimer) { clearTimeout(enterTimer); enterTimer = null; }

  if (current) {
    current.classList.remove('is-entering');
    current.classList.add('is-exiting');
    exitTimer = setTimeout(() => {
      current.classList.remove('is-exiting');
      current.hidden = true;
      exitTimer = null;
    }, 200);
  }

  target.hidden = false;
  target.classList.remove('is-exiting');
  target.classList.add('is-entering');
  enterTimer = setTimeout(() => {
    target.classList.remove('is-entering');
    enterTimer = null;
  }, 420);
}

for (const switcher of document.querySelectorAll<HTMLElement>('[data-island="switcher"]')) {
  const kind = switcher.dataset.switch;
  if (kind === 'range-format') initSwitcher(switcher, { onChange: (value) => { rangeState.format = value; applyRange(); } });
  if (kind === 'range-lang') initSwitcher(switcher, { onChange: (value) => { rangeState.lang = value; applyRange(); } });
  if (kind === 'range-accent') initSwitcher(switcher, { onChange: (value) => {
    if (rangeStage) rangeStage.className = rangeStage.className.replace(/\bcat-[\w-]+\b/, value);
    rangeState.accent = value;
  } });
}

initSurfaces();
initSurfacesBand();
initLedgerline();

for (const embedsBand of document.querySelectorAll<HTMLElement>('[data-island="embeds"]')) {
  initEmbeds(embedsBand);
}

const analyticsBand = document.querySelector<HTMLElement>('[data-island="analytics"]');
if (analyticsBand) initAnalytics(analyticsBand);

initReveal();
