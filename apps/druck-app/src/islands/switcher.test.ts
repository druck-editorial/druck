// @vitest-environment happy-dom
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { initSwitcher } from './switcher.js';

function buildSwitcherDom(): HTMLElement {
  document.body.innerHTML = `
    <div data-switch="format" role="radiogroup">
      <button role="radio" aria-checked="true" data-value="feature">Feature</button>
      <button role="radio" aria-checked="false" data-value="wire">Wire</button>
    </div>
    <div class="stage">
      <div data-format="feature">A</div>
      <div data-format="wire" hidden>B</div>
    </div>`;
  return document.querySelector('[data-switch]') as HTMLElement;
}

describe('initSwitcher', () => {
  beforeEach(() => buildSwitcherDom());

  test('clicking a radio shows its panels and updates aria-checked', () => {
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format' });
    const wireButton = document.querySelector('[data-value="wire"]') as HTMLButtonElement;
    wireButton.click();
    expect(wireButton.getAttribute('aria-checked')).toBe('true');
    expect((document.querySelector('[data-format="wire"]') as HTMLElement).hidden).toBe(false);
    expect((document.querySelector('[data-format="feature"]') as HTMLElement).hidden).toBe(true);
  });

  test('arrow keys move selection and focus', () => {
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format' });
    const [first, second] = [...document.querySelectorAll('[role="radio"]')] as HTMLButtonElement[];
    first.focus();
    first.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(second.getAttribute('aria-checked')).toBe('true');
  });

  test('invokes onChange callback with the selected value', () => {
    const onChange = vi.fn();
    initSwitcher(document.querySelector('[data-switch]')!, { datasetKey: 'format', onChange });
    (document.querySelector('[data-value="wire"]') as HTMLButtonElement).click();
    expect(onChange).toHaveBeenCalledWith('wire');
  });
});
