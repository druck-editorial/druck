// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
// @vitest-environment happy-dom
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { playSequence, SEQUENCE_STEP_MS } from './sequence.js';

function buildStage(): HTMLElement {
  document.body.innerHTML = `
    <div class="hero-stage">
      <pre><code>
        <span class="jl" data-key="category">c</span>
        <span class="jl" data-key="title">t</span>
      </code></pre>
      <div>
        <div class="hx" data-step="1"></div>
        <div class="hx" data-step="2"></div>
      </div>
      <button data-role="replay" hidden></button>
    </div>`;
  return document.querySelector('.hero-stage') as HTMLElement;
}

describe('playSequence', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  test('reveals steps in order and finishes in done state', () => {
    const stage = buildStage();
    playSequence(stage);
    expect(stage.dataset.state).toBe('playing');
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-step="1"]')!.classList.contains('on')).toBe(true);
    expect(stage.querySelector('[data-step="2"]')!.classList.contains('on')).toBe(false);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS * 2);
    expect(stage.dataset.state).toBe('done');
    expect((stage.querySelector('[data-role="replay"]') as HTMLElement).hidden).toBe(false);
  });

  test('lights the matching json line during its step', () => {
    const stage = buildStage();
    playSequence(stage);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-key="category"]')!.classList.contains('lit')).toBe(true);
  });

  test('uses custom step-keys when provided', () => {
    document.body.innerHTML = `
      <div class="hero-stage" data-step-keys="heroImage,title">
        <pre><code>
          <span class="jl" data-key="heroImage">i</span>
          <span class="jl" data-key="title">t</span>
        </code></pre>
        <div><div class="hx" data-step="1"></div><div class="hx" data-step="2"></div></div>
        <button data-role="replay" hidden></button>
      </div>`;
    const stage = document.querySelector('.hero-stage') as HTMLElement;
    playSequence(stage);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-key="heroImage"]')!.classList.contains('lit')).toBe(true);
    expect(stage.querySelector('[data-key="title"]')!.classList.contains('lit')).toBe(false);
    vi.advanceTimersByTime(SEQUENCE_STEP_MS);
    expect(stage.querySelector('[data-key="title"]')!.classList.contains('lit')).toBe(true);
  });
});
