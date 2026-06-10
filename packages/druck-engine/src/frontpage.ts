import type { ArticleData, RenderOptions } from './types.js';

export type FrontPageRowType = 'hero' | 'feature' | 'triple' | 'brief';

export interface FrontPageRow {
  type: FrontPageRowType;
  items: ArticleData[];
}

const BRIEF_MAX = 5;

export function buildFrontPage(items: ArticleData[]): FrontPageRow[] {
  if (!items.length) return [];
  const pool = [...items];
  const hotIdx = pool.findIndex((entry) => entry.hot);
  if (hotIdx > 0) pool.unshift(pool.splice(hotIdx, 1)[0]);

  const rows: FrontPageRow[] = [{ type: 'hero', items: pool.splice(0, 1) }];
  if (pool.length >= 2) rows.push({ type: 'feature', items: pool.splice(0, 2) });
  if (pool.length >= 3) rows.push({ type: 'triple', items: pool.splice(0, 3) });
  const brief = pool.splice(0, BRIEF_MAX);
  if (brief.length) rows.push({ type: 'brief', items: brief });
  return rows;
}

export function renderFrontPage(rows: FrontPageRow[], opts?: RenderOptions): string {
  void rows;
  void opts;
  throw new Error('renderFrontPage: implemented in the next commit');
}
