// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
export function initLedgerline(): void {
  const pipeline = document.querySelector<HTMLElement>('[data-island="ledgerline"]');
  if (!pipeline) return;

  const steps = [...pipeline.querySelectorAll<HTMLElement>('.scene-step')];
  const bubbles = [...pipeline.querySelectorAll<HTMLElement>('.tg-msg')];
  const feed = pipeline.querySelector<HTMLElement>('druck-feed');

  // Scene reveal with stagger
  const observer = new IntersectionObserver(
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          for (const step of steps) step.classList.add('revealed');
          observer.disconnect();
        }
      }
    },
    { threshold: 0.2 },
  );
  observer.observe(pipeline);

  if (!feed) return;

  const applyPairing = (cards: Element[]): void => {
    for (const bubble of bubbles) {
      const idx = bubble.dataset.index ?? '';
      const card = cards.find((c) => c.getAttribute('data-index') === idx);
      if (!card) continue;
      const on = () => {
        (card as HTMLElement).style.transform = 'translateY(-2px)';
        (card as HTMLElement).style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
      };
      const off = () => {
        (card as HTMLElement).style.transform = '';
        (card as HTMLElement).style.boxShadow = '';
      };
      bubble.addEventListener('mouseenter', on);
      bubble.addEventListener('mouseleave', off);
      bubble.addEventListener('focus', on);
      bubble.addEventListener('blur', off);
    }
  };

  let paired = false;
  const tryPair = (): void => {
    if (paired) return;
    const shadow = (feed as any).shadowRoot as ShadowRoot | null;
    if (!shadow) return;
    const listitems = [...shadow.querySelectorAll('[role="listitem"]')];
    const cards = listitems.map((item, i) => {
      const card = item.querySelector('.druck-card');
      if (card) card.setAttribute('data-index', String(i));
      return card;
    }).filter((c): c is Element => c !== null);
    if (cards.length === 0) return;
    paired = true;
    applyPairing(cards);
  };

  feed.addEventListener('druck:feed-rendered', tryPair);
  // Fallback: if already rendered before listener attached
  setTimeout(tryPair, 500);
}
