import './styles/fonts.css';
import './styles.css';
import './styles/landing.css';
import '@druck/css/article.css';
import '@druck/css/feed.css';
import copyIcon from './icons/copy.svg?raw';
import replayIcon from './icons/arrow-counter-clockwise.svg?raw';
import { initThemeToggle } from './islands/theme.js';
import { initCopyButton } from './islands/copy.js';
import { initProgressRail } from './islands/rail.js';
import { initSequence } from './islands/sequence.js';
import { initSwitcher } from './islands/switcher.js';
import { initSurfaces } from './islands/surfaces.js';
import { initEmbeds } from './islands/embeds.js';
import { initColophonLine } from './islands/colophonLine.js';

const ICONS: Record<string, string> = {
  copy: copyIcon,
  'arrow-counter-clockwise': replayIcon,
};

for (const slot of document.querySelectorAll<HTMLElement>('.icon-slot[data-icon]')) {
  slot.innerHTML = ICONS[slot.dataset.icon ?? ''] ?? '';
}

const themeButton = document.querySelector<HTMLElement>('[data-island="theme"]');
if (themeButton) initThemeToggle(themeButton);

for (const button of document.querySelectorAll<HTMLElement>('[data-island="copy"]')) {
  initCopyButton(button);
}

const rail = document.querySelector<HTMLElement>('[data-island="rail"]');
if (rail) initProgressRail(rail);

const stage = document.querySelector<HTMLElement>('[data-island="sequence"]');
if (stage) initSequence(stage);

const rangeStage = document.querySelector<HTMLElement>('.range-stage');
const rangeState = { format: 'feature', lang: 'en' };
const applyRange = (): void => {
  if (!rangeStage) return;
  for (const panel of rangeStage.querySelectorAll<HTMLElement>('.specimen-panel')) {
    panel.hidden = !(panel.dataset.format === rangeState.format && panel.dataset.lang === rangeState.lang);
  }
};
for (const switcher of document.querySelectorAll<HTMLElement>('[data-island="switcher"]')) {
  const kind = switcher.dataset.switch;
  if (kind === 'range-format') initSwitcher(switcher, { datasetKey: 'range-noop', onChange: (value) => { rangeState.format = value; applyRange(); } });
  if (kind === 'range-lang') initSwitcher(switcher, { datasetKey: 'range-noop', onChange: (value) => { rangeState.lang = value; applyRange(); } });
  if (kind === 'range-accent') initSwitcher(switcher, { datasetKey: 'range-noop', onChange: (value) => { if (rangeStage) rangeStage.className = rangeStage.className.replace(/\bcat-[\w-]+\b/, value); } });
}

initSurfaces();

for (const embedsBand of document.querySelectorAll<HTMLElement>('[data-island="embeds"]')) {
  initEmbeds(embedsBand);
}

const colophonLine = document.querySelector<HTMLElement>('[data-island="colophon-line"]');
if (colophonLine) initColophonLine(colophonLine);
