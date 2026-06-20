// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { buildFrontPage, escapeHtml, safeUrl } from '@druck-editorial/engine';

const SHOWCASE_LIST_MAX = 12;

export function partition(items) {
  const rows = buildFrontPage(items);
  const lead = rows.find((r) => r.type === 'hero')?.items[0];
  const rest = rows.filter((r) => r.type !== 'hero').flatMap((r) => r.items);
  return { lead, rest };
}

const href = (item) => escapeHtml(safeUrl(item.shareUrl ?? '') || '#');

function composeBloomberg(items) {
  const { lead, rest } = partition(items);
  const row = (i) => `<a class="bb-row" href="${href(i)}"><span class="bb-t">${escapeHtml(i.title)}</span><span class="bb-c">${escapeHtml(i.category)}</span></a>`;
  return `<div class="sx-bloomberg"><div class="bb-inner">` +
    `<div class="bb-top"><span>DRUCK TERMINAL</span><span>TOP STORIES</span></div>` +
    (lead ? `<a class="bb-row bb-lead" href="${href(lead)}"><span class="bb-t">${escapeHtml(lead.title)}</span><span class="bb-c bb-hot">HOT</span></a>` : '') +
    rest.slice(0, SHOWCASE_LIST_MAX).map(row).join('') +
    `</div></div>`;
}

function composeBauhaus(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-bauhaus"><span class="bh-circ"></span><span class="bh-bar"></span><span class="bh-sq"></span><div class="bh-inner">` +
    (lead ? `<a class="bh-lead" href="${href(lead)}"><div class="bh-k">${escapeHtml(lead.category)}</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="bh-list">${rest.slice(0, SHOWCASE_LIST_MAX).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}

function composeTabloid(items) {
  const { lead, rest } = partition(items);
  return `<div class="sx-tabloid"><div class="tb-mast">Druck</div><div class="tb-inner">` +
    (lead ? `<a class="tb-lead" href="${href(lead)}"><div class="tb-k">Exclusive</div><h2>${escapeHtml(lead.title)}</h2></a>` : '') +
    `<ul class="tb-list">${rest.slice(0, SHOWCASE_LIST_MAX).map((i) => `<li><a href="${href(i)}">${escapeHtml(i.title)}</a></li>`).join('')}</ul>` +
    `</div></div>`;
}

export const SPECTACLE = [
  { key: 'bloomberg', name: 'Bloomberg', render: composeBloomberg },
  { key: 'bauhaus', name: 'Bauhaus', render: composeBauhaus },
  { key: 'tabloid', name: 'Tabloid', render: composeTabloid },
];
