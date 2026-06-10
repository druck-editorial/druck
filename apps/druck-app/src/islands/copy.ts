// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
const COPIED_RESET_MS = 1600;

export function initCopyButton(button: HTMLElement): void {
  button.addEventListener('click', async () => {
    const text = button.dataset.copyText ?? '';
    try {
      await navigator.clipboard.writeText(text);
      button.dataset.copied = 'true';
      window.setTimeout(() => delete button.dataset.copied, COPIED_RESET_MS);
    } catch {
      button.dataset.copied = 'failed';
    }
  });
}
