import './styles/fonts.css';
import './styles.css';
import './styles/landing.css';
import '@druck/css/article.css';
import copyIcon from './icons/copy.svg?raw';
import replayIcon from './icons/arrow-counter-clockwise.svg?raw';
import { initThemeToggle } from './islands/theme.js';
import { initCopyButton } from './islands/copy.js';
import { initProgressRail } from './islands/rail.js';
import { initSequence } from './islands/sequence.js';
import { initSwitcher } from './islands/switcher.js';
import { initSurfaces } from './islands/surfaces.js';
import { initEmbeds } from './islands/embeds.js';
import { initAnalyticsPanel } from './islands/analyticsPanel.js';

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

for (const switcher of document.querySelectorAll<HTMLElement>('[data-island="switcher"]')) {
  const kind = switcher.dataset.switch;
  if (kind === 'format') initSwitcher(switcher, { datasetKey: 'format' });
  if (kind === 'lang') initSwitcher(switcher, { datasetKey: 'lang' });
  if (kind === 'accent') {
    initSwitcher(switcher, {
      datasetKey: 'accent-unused',
      onChange: (value) => {
        const shell = document.querySelector('.band4-article .article-shell');
        if (!shell) return;
        shell.className = shell.className.replace(/\bcat-[\w-]+\b/, value);
      },
    });
  }
}

initSurfaces();

for (const embedsBand of document.querySelectorAll<HTMLElement>('[data-island="embeds"]')) {
  initEmbeds(embedsBand);
}

const articleRoot = document.querySelector<HTMLElement>('.band4-article .article-shell');
if (articleRoot) initAnalyticsPanel(articleRoot);
