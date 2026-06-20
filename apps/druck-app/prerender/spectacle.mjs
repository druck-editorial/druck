// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { buildFrontPage, escapeHtml, safeUrl } from '@druck-editorial/engine';

export function partition(items) {
  const rows = buildFrontPage(items);
  const lead = rows.find((r) => r.type === 'hero')?.items[0];
  const rest = rows.filter((r) => r.type !== 'hero').flatMap((r) => r.items);
  return { lead, rest };
}

const href = (item) => escapeHtml(safeUrl(item.shareUrl ?? '') || '#');
const img = (item) => escapeHtml(safeUrl(item.heroImage) || 'data:,');

function composeAqua(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-aqua"><div class="aq-win">` +
    `<div class="aq-bar"><i class="r"></i><i class="y"></i><i class="g"></i><span class="aq-t">Druck</span></div>` +
    `<div class="aq-body">` +
    (lead ? `<a class="aq-lead" href="${href(lead)}"><img src="${img(lead)}" alt="" loading="lazy" width="1200" height="675"><div class="aq-txt"><div class="aq-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p><span class="aq-btn">Read</span></div></a>` : '') +
    `<ul class="aq-list">${rest.slice(0, 7).map((i) => `<li><a href="${href(i)}"><span class="aq-dot"></span>${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div></div>`;
}

function composeAero(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-aero"><div class="ae-glass"><div class="ae-orb"></div>` +
    (lead ? `<a class="ae-lead" href="${href(lead)}"><div class="ae-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p></a>` : '') +
    `<ul class="ae-list">${rest.slice(0, 6).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}

export const SPECTACLE = [
  { key: 'aqua', name: 'Aqua', render: composeAqua },
  { key: 'aero', name: 'Aero', render: composeAero },
];
