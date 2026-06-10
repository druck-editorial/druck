// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
export const SEQUENCE_STEP_MS = 700;

function stepToKey(stage: HTMLElement, step: number): string | undefined {
  const custom = stage.dataset.stepKeys;
  if (custom) {
    const keys = custom.split(',');
    return keys[step - 1]?.trim();
  }
  const defaults: Record<string, string> = {
    '1': 'category',
    '2': 'title',
    '3': 'subtitle',
    '4': 'heroImage',
    '5': 'chapters',
  };
  return defaults[String(step)];
}

function setStep(stage: HTMLElement, step: number): void {
  for (const el of stage.querySelectorAll<HTMLElement>('.hx')) {
    el.classList.toggle('on', Number(el.dataset.step) <= step);
  }
  for (const line of stage.querySelectorAll<HTMLElement>('.jl[data-key]')) {
    line.classList.toggle('lit', line.dataset.key === stepToKey(stage, step));
  }
}

export function playSequence(stage: HTMLElement): void {
  const steps = Math.max(
    0,
    ...[...stage.querySelectorAll<HTMLElement>('.hx')].map((el) => Number(el.dataset.step) || 0),
  );
  const replay = stage.querySelector<HTMLElement>('[data-role="replay"]');
  stage.dataset.state = 'playing';
  setStep(stage, 0);
  let current = 0;
  const tick = (): void => {
    current += 1;
    setStep(stage, current);
    if (current < steps) {
      window.setTimeout(tick, SEQUENCE_STEP_MS);
      return;
    }
    stage.dataset.state = 'done';
    if (replay) replay.hidden = false;
  };
  window.setTimeout(tick, SEQUENCE_STEP_MS);
}

export function initSequence(stage: HTMLElement): void {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    stage.dataset.state = 'static';
    return;
  }
  stage.querySelector<HTMLElement>('[data-role="replay"]')?.addEventListener('click', () => playSequence(stage));
  const observer = new IntersectionObserver(
    (entries) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      observer.disconnect();
      playSequence(stage);
    },
    { threshold: 0.2 }
  );
  observer.observe(stage);
}
