// SPDX-License-Identifier: MIT
// Copyright (c) 2026 Artem Iagovdik <artyom.yagovdik@gmail.com>
import { escapeHtml, safeUrl } from './format.js';
import { categoryClass, renderCard } from './render.js';
import type { ArticleData, FrontPageLook, RenderOptions } from './types.js';

export type FrontPageRowType = 'hero' | 'feature' | 'triple' | 'brief';

export interface FrontPageItem extends ArticleData {
  role: 'lead' | 'feature' | 'brief';
  hasImage: boolean;
}

export interface FrontPageRow {
  type: FrontPageRowType;
  items: FrontPageItem[];
}

const BRIEF_MAX = 5;

const ROLE_BY_TYPE: Record<FrontPageRowType, FrontPageItem['role']> = {
  hero: 'lead',
  feature: 'feature',
  triple: 'feature',
  brief: 'brief',
};

function enrichItem(data: ArticleData, role: FrontPageItem['role']): FrontPageItem {
  return { ...data, role, hasImage: Boolean(safeUrl(data.heroImage)) };
}

export function buildFrontPage(items: ArticleData[]): FrontPageRow[] {
  if (!items.length) return [];
  const pool = [...items];
  const hotIdx = pool.findIndex((entry) => entry.hot);
  if (hotIdx > 0) pool.unshift(pool.splice(hotIdx, 1)[0]);

  const raw: { type: FrontPageRowType; items: ArticleData[] }[] = [
    { type: 'hero', items: pool.splice(0, 1) },
  ];
  if (pool.length >= 2) raw.push({ type: 'feature', items: pool.splice(0, 2) });
  if (pool.length >= 3) raw.push({ type: 'triple', items: pool.splice(0, 3) });
  const brief = pool.splice(0, BRIEF_MAX);
  if (brief.length) raw.push({ type: 'brief', items: brief });

  return raw.map((row) => ({
    type: row.type,
    items: row.items.map((data) => enrichItem(data, ROLE_BY_TYPE[row.type])),
  }));
}

function renderHeroCard(data: ArticleData): string {
  const href = safeUrl(data.shareUrl ?? '') || '#';
  const imgSrc = safeUrl(data.heroImage) || 'data:,';
  return (
    `<a class="df-hero-card ${categoryClass(data.category)}" href="${escapeHtml(href)}">` +
    `<img class="df-hero-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(data.heroImageAlt ?? data.title)}" loading="lazy" width="1200" height="675">` +
    '<div class="df-hero-scrim" aria-hidden="true"></div>' +
    '<div class="df-hero-text">' +
    (data.hot ? '<span class="df-hot">HOT</span>' : '') +
    `<div class="card-kicker">${escapeHtml(data.category)}</div>` +
    `<h3 class="df-hero-title">${escapeHtml(data.title)}</h3>` +
    `<p class="df-hero-sub">${escapeHtml(data.subtitle)}</p>` +
    '</div></a>'
  );
}

function renderBriefItem(data: ArticleData): string {
  const href = safeUrl(data.shareUrl ?? '') || '#';
  return (
    `<li><a href="${escapeHtml(href)}">` +
    `<span class="df-brief-title">${escapeHtml(data.title)}</span>` +
    `<time>${escapeHtml(data.publishedAt)}</time>` +
    '</a></li>'
  );
}

export type FrontPageComposer = (rows: FrontPageRow[], opts?: RenderOptions) => string;

function composeClassic(rows: FrontPageRow[], opts?: RenderOptions): string {
  return rows
    .map((row) => {
      if (row.type === 'hero') {
        return `<div class="df-row df-row--hero">${renderHeroCard(row.items[0])}</div>`;
      }
      if (row.type === 'brief') {
        const lis = row.items.map(renderBriefItem).join('');
        return `<div class="df-row df-row--brief"><div class="df-brief-label">In brief</div><ul>${lis}</ul></div>`;
      }
      const cls = row.type === 'feature' ? 'df-row--feature' : 'df-row--triple';
      const cards = row.items.map((entry) => renderCard(entry, opts)).join('');
      return `<div class="df-row ${cls}">${cards}</div>`;
    })
    .join('');
}

export interface FrontPagePartition {
  lead?: FrontPageItem;
  cells: FrontPageItem[];
  brief: FrontPageItem[];
}

export function partitionRows(rows: FrontPageRow[]): FrontPagePartition {
  return {
    lead: rows.find((r) => r.type === 'hero')?.items[0],
    cells: rows.filter((r) => r.type === 'feature' || r.type === 'triple').flatMap((r) => r.items),
    brief: rows.find((r) => r.type === 'brief')?.items ?? [],
  };
}

function safeHref(item: FrontPageItem): string {
  return escapeHtml(safeUrl(item.shareUrl ?? '') || '#');
}

function safeImg(item: FrontPageItem): string {
  return escapeHtml(safeUrl(item.heroImage) || 'data:,');
}

function brutalistLead(item: FrontPageItem): string {
  const kicker = `${item.category}${item.hot ? ' / Hot' : ''}`;
  return (
    '<div class="dfb-lead">' +
    '<div class="dfb-head">' +
    `<span class="dfb-kicker">${escapeHtml(kicker)}</span>` +
    `<a class="dfb-title" href="${safeHref(item)}"><h2>${escapeHtml(item.title)}</h2></a>` +
    '</div>' +
    `<a class="dfb-img" href="${safeHref(item)}">` +
    `<img src="${safeImg(item)}" alt="${escapeHtml(item.heroImageAlt ?? item.title)}" loading="lazy" width="1200" height="675">` +
    '</a>' +
    '</div>'
  );
}

function brutalistCell(item: FrontPageItem, n: number): string {
  return (
    `<a class="dfb-cell" href="${safeHref(item)}">` +
    `<span class="dfb-n">${String(n).padStart(2, '0')}</span>` +
    `<span class="dfb-ck">${escapeHtml(item.category)}</span>` +
    `<h3>${escapeHtml(item.title)}</h3>` +
    '</a>'
  );
}

function brutalistBriefItem(item: FrontPageItem): string {
  return (
    `<li><a href="${safeHref(item)}">` +
    `<span class="dfb-bt">${escapeHtml(item.title)}</span>` +
    `<time>${escapeHtml(item.publishedAt)}</time>` +
    '</a></li>'
  );
}

function composeBrutalist(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [
    '<div class="dfb-mast"><span class="dfb-wm">Druck</span></div><div class="dfb-rule"></div>',
  ];
  if (lead) parts.push(brutalistLead(lead));
  if (cells.length) {
    parts.push(`<div class="dfb-grid">${cells.map((c, i) => brutalistCell(c, i + 2)).join('')}</div>`);
  }
  if (brief.length) {
    parts.push(`<ol class="dfb-brief">${brief.map(brutalistBriefItem).join('')}</ol>`);
  }
  return parts.join('');
}

function composeSwiss(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [];
  if (lead) {
    parts.push(
      `<div class="dfsw-top"><span class="dfsw-wm">Druck</span><span class="dfsw-meta">${escapeHtml(lead.publishedAt)}</span></div>` +
      '<div class="dfsw-acc"></div>' +
      '<div class="dfsw-lead"><div class="dfsw-head">' +
      `<div class="dfsw-cat">${escapeHtml(lead.category)}</div>` +
      `<a class="dfsw-title" href="${safeHref(lead)}"><h2>${escapeHtml(lead.title)}</h2></a>` +
      `<p class="dfsw-dek">${escapeHtml(lead.subtitle)}</p></div>` +
      `<a class="dfsw-img" href="${safeHref(lead)}"><img src="${safeImg(lead)}" alt="${escapeHtml(lead.heroImageAlt ?? lead.title)}" loading="lazy" width="1200" height="675"></a>` +
      '</div>'
    );
  }
  if (cells.length) {
    parts.push('<div class="dfsw-grid">' + cells.map((c) =>
      `<a class="dfsw-cell" href="${safeHref(c)}"><div class="dfsw-k">${escapeHtml(c.category)}</div>` +
      `<h3>${escapeHtml(c.title)}</h3><p>${escapeHtml(c.subtitle)}</p></a>`
    ).join('') + '</div>');
  }
  if (brief.length) {
    parts.push('<ol class="dfsw-brief">' + brief.map((b) =>
      `<li><a href="${safeHref(b)}"><span class="dfsw-bt">${escapeHtml(b.title)}</span><time>${escapeHtml(b.publishedAt)}</time></a></li>`
    ).join('') + '</ol>');
  }
  return parts.join('');
}

function composeHelvetica(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [
    `<div class="dfhe-top"><span class="dfhe-wm">Druck</span><span class="dfhe-meta">${escapeHtml(lead?.publishedAt ?? '')}</span></div>`,
  ];
  if (lead) {
    parts.push(
      `<a class="dfhe-lead" href="${safeHref(lead)}">` +
      `<span class="dfhe-cat">${escapeHtml(lead.category)}</span>` +
      `<h2>${escapeHtml(lead.title)}</h2><p>${escapeHtml(lead.subtitle)}</p></a>`
    );
  }
  const rest = [...cells, ...brief];
  if (rest.length) {
    parts.push('<ol class="dfhe-list">' + rest.map((i) =>
      `<li><a href="${safeHref(i)}"><span class="dfhe-c">${escapeHtml(i.category)}</span>` +
      `<span class="dfhe-t">${escapeHtml(i.title)}</span></a></li>`
    ).join('') + '</ol>');
  }
  return parts.join('');
}

function composeBroadsheet(rows: FrontPageRow[], _opts?: RenderOptions): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = ['<div class="dfbr-mast">The Druck</div><div class="dfbr-rule"></div>'];
  if (lead) {
    parts.push(`<div class="dfbr-date">${escapeHtml(lead.publishedAt)}</div>`);
    parts.push(`<a class="dfbr-leadtitle" href="${safeHref(lead)}"><h2>${escapeHtml(lead.title)}</h2></a>`);
    parts.push(`<p class="dfbr-sub">${escapeHtml(lead.subtitle)}</p>`);
  }
  const stories = [...cells, ...brief];
  if (stories.length) {
    parts.push('<div class="dfbr-cols">' + stories.map((s, i) =>
      `<div class="dfbr-story${i === 0 ? ' dfbr-drop' : ''}"><h3>${escapeHtml(s.category)}</h3>` +
      `<a href="${safeHref(s)}"><b>${escapeHtml(s.title)}</b></a> ${escapeHtml(s.subtitle)}</div>`
    ).join('') + '</div>');
  }
  return parts.join('');
}

function composeHeroBlocks(rows: FrontPageRow[], prefix: string): string {
  const { lead, cells, brief } = partitionRows(rows);
  const parts: string[] = [];
  if (lead) {
    parts.push(
      `<a class="${prefix}-hero" href="${safeHref(lead)}">` +
      `<img src="${safeImg(lead)}" alt="${escapeHtml(lead.heroImageAlt ?? lead.title)}" loading="lazy" width="1600" height="900">` +
      `<span class="${prefix}-scrim"></span>` +
      `<span class="${prefix}-htext"><span class="${prefix}-kick">${escapeHtml(lead.category)}</span>` +
      `<h2>${escapeHtml(lead.title)}</h2></span></a>`
    );
  }
  const stories = [...cells, ...brief].slice(0, 6);
  if (stories.length) {
    parts.push(`<div class="${prefix}-body">` + stories.map((s) =>
      `<a class="${prefix}-story" href="${safeHref(s)}"><span class="${prefix}-k">${escapeHtml(s.category)}</span>` +
      `<h3>${escapeHtml(s.title)}</h3><p>${escapeHtml(s.subtitle)}</p></a>`
    ).join('') + '</div>');
  }
  return parts.join('');
}

function composeLuxury(rows: FrontPageRow[], _opts?: RenderOptions): string {
  return composeHeroBlocks(rows, 'dflx');
}

function composeNoir(rows: FrontPageRow[], _opts?: RenderOptions): string {
  return composeHeroBlocks(rows, 'dfnr');
}

const COMPOSERS: Partial<Record<FrontPageLook, FrontPageComposer>> = {
  classic: composeClassic,
  brutalist: composeBrutalist,
  swiss: composeSwiss,
  helvetica: composeHelvetica,
  broadsheet: composeBroadsheet,
  luxury: composeLuxury,
  noir: composeNoir,
};

export function renderFrontPage(rows: FrontPageRow[], opts?: RenderOptions): string {
  const requested = opts?.look ?? 'classic';
  const compose = COMPOSERS[requested] ?? composeClassic;
  const look: FrontPageLook = COMPOSERS[requested] ? requested : 'classic';
  const lookClass = look === 'classic' ? '' : ` druck-front-page--${look}`;
  return `<div class="druck-front-page${lookClass}">${compose(rows, opts)}</div>`;
}
