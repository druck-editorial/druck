// @vitest-environment happy-dom
import { describe, expect, test, vi } from 'vitest';
import { initCopyButton } from './copy.js';

describe('initCopyButton', () => {
  test('writes data-copy-text to the clipboard and flips state', async () => {
    document.body.innerHTML = `<button data-copy-text="hello"><span class="icon-slot"></span></button>`;
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', { value: { writeText }, configurable: true });
    const button = document.querySelector('button') as HTMLButtonElement;
    initCopyButton(button);
    button.click();
    await vi.waitFor(() => expect(button.dataset.copied).toBe('true'));
    expect(writeText).toHaveBeenCalledWith('hello');
  });
});
